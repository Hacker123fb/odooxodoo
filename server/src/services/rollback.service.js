import pool from '../config/db.js';
import { AppError } from '../utils/customError.js';
import { HttpStatusCodes } from '../utils/httpStatusCodes.js';
import { decodeId, encodeId } from '../utils/idCodec.js';
import vehicleModel from '../models/vehicle.model.js';
import { driverModel } from '../models/driver.model.js';
import tripModel from '../models/trip.model.js';
import maintenanceModel from '../models/maintenance.model.js';
import fuelModel from '../models/fuel.model.js';
import expenseModel from '../models/expense.model.js';
import { userModel } from '../models/userModel.js';
import { unblockIp, unlockAccount } from '../middleware/ipBlocker.js';
import auditService from './audit.service.js';
import { invalidateDashboardCache } from './dashboard.service.js';

export const rollbackService = {
  /**
   * Execute rollback of a recorded action to its previous state
   * @param {number|string} logId - Audit log record ID
   * @param {object} currentUser - The super admin executing the rollback
   * @param {object} req - Express request object for audit logging
   */
  async rollbackLogAction(logId, currentUser, req) {
    if (!logId) {
      throw new AppError('Audit Log ID is required for rollback.', HttpStatusCodes.BAD_REQUEST);
    }

    // 1. Fetch audit log entry from database or memory/file
    let logEntry = null;
    try {
      const [rows] = await pool.query('SELECT * FROM audit_logs WHERE id = ?', [logId]);
      if (rows && rows.length > 0) {
        logEntry = rows[0];
      }
    } catch (dbErr) {
      console.warn('[ROLLBACK] DB query warning:', dbErr.message);
    }

    // Fallback: If not found in DB or DB not available, query from auditService
    if (!logEntry) {
      const logsResult = await auditService.getAuditLogs({ limit: 100 });
      logEntry = (logsResult.data || []).find(l => String(l.id) === String(logId));
    }

    if (!logEntry) {
      throw new AppError(`Audit activity record #${logId} not found.`, HttpStatusCodes.NOT_FOUND);
    }

    // Parse details if string
    let details = logEntry.details;
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        details = {};
      }
    } else if (!details) {
      details = {};
    }

    // Check if already rolled back
    if (details.rolledBack) {
      throw new AppError(
        `This action was already rolled back on ${new Date(details.rolledBackAt).toLocaleString()} by ${details.rolledBackBy}.`,
        HttpStatusCodes.BAD_REQUEST
      );
    }

    const { action } = logEntry;
    const resourceType = details.resourceType || logEntry.resource_type;
    const rawResourceId = details.resourceId || details.rawId || logEntry.resource_id;
    const numericId = typeof rawResourceId === 'string' ? decodeId(rawResourceId) || parseInt(rawResourceId, 10) : rawResourceId;

    let rollbackMessage = 'State successfully rolled back to previous state.';

    // 2. Dispatch to specific rollback handler based on action
    if (action.startsWith('CREATE_') || action === 'RECORD_EXPENSE') {
      // Rolling back a CREATE means deleting the injected/malicious record
      await this._rollbackCreate(action, resourceType, numericId, details);
      rollbackMessage = `Created ${resourceType || 'entity'} has been removed to restore original state.`;

    } else if (action.startsWith('UPDATE_')) {
      // Rolling back an UPDATE means restoring the previous field snapshot
      await this._rollbackUpdate(action, resourceType, numericId, details);
      rollbackMessage = `${resourceType || 'Entity'} has been reverted to its previous attributes.`;

    } else if (action.startsWith('DELETE_')) {
      // Rolling back a DELETE means re-inserting the previous record
      await this._rollbackDelete(action, resourceType, numericId, details);
      rollbackMessage = `Deleted ${resourceType || 'entity'} has been restored to the system.`;

    } else if (action === 'ADMIN_REVOKE_IP_ACCESS') {
      const ip = details.revokedIp || logEntry.ip_address;
      if (ip) {
        unblockIp(ip, true);
        rollbackMessage = `IP ${ip} access revocation has been reversed.`;
      }

    } else if (action === 'ADMIN_LOCK_ACCOUNT') {
      const email = details.lockedUserEmail;
      if (email) {
        const user = await userModel.findByEmail(email);
        if (user) {
          await userModel.updateStatus(user.id, 'ACTIVE');
          unlockAccount(email, true);
          rollbackMessage = `Account ${email} safety freeze has been reversed; status restored to ACTIVE.`;
        }
      }

    } else {
      throw new AppError(
        `Action '${action}' cannot be rolled back automatically. Only state-modifying actions are rollback-eligible.`,
        HttpStatusCodes.BAD_REQUEST
      );
    }

    // 3. Mark the audit log as rolled back in PostgreSQL
    const updatedDetails = {
      ...details,
      rolledBack: true,
      rolledBackAt: new Date().toISOString(),
      rolledBackBy: currentUser?.email || 'SUPER_ADMIN'
    };

    try {
      await pool.query(
        'UPDATE audit_logs SET details = ?::jsonb WHERE id = ?',
        [JSON.stringify(updatedDetails), logId]
      );
    } catch (upErr) {
      console.warn('[ROLLBACK DB UPDATE]:', upErr.message);
    }

    // 4. Record new audit event for the rollback action
    auditService.logActionEvent({
      req,
      action: 'ADMIN_ROLLBACK_ACTION',
      status: 'SUCCESS',
      resourceType: resourceType || 'audit_record',
      resourceId: String(logId),
      details: {
        targetLogId: logId,
        originalAction: action,
        targetResource: resourceType,
        targetResourceId: rawResourceId,
        revertedBy: currentUser?.email || 'SUPER_ADMIN',
        reason: 'Super Admin invoked security rollback on suspicious hacker activity'
      }
    });

    invalidateDashboardCache();

    return {
      success: true,
      logId,
      action,
      resourceType,
      message: rollbackMessage,
      rolledBackAt: updatedDetails.rolledBackAt
    };
  },

  /**
   * Roll back a CREATE action (deletes the newly created entity)
   */
  async _rollbackCreate(action, resourceType, id, details) {
    if (!id && details?.deletedVehicleId) id = details.deletedVehicleId;
    if (!id && details?.newState?.id) id = details.newState.id;

    if (!id) {
      throw new AppError(`Cannot rollback ${action}: Resource ID could not be identified.`, HttpStatusCodes.BAD_REQUEST);
    }

    switch (resourceType) {
      case 'vehicle':
        await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
        break;
      case 'driver':
        await pool.query('DELETE FROM drivers WHERE id = ?', [id]);
        break;
      case 'trip':
        await pool.query('DELETE FROM trips WHERE id = ?', [id]);
        break;
      case 'maintenance':
        await pool.query('DELETE FROM maintenance_logs WHERE id = ?', [id]);
        break;
      case 'fuel':
        await pool.query('DELETE FROM fuel_logs WHERE id = ?', [id]);
        break;
      case 'expense':
        await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
        break;
      default:
        throw new AppError(`Rollback not supported for resource type '${resourceType}'.`, HttpStatusCodes.BAD_REQUEST);
    }
  },

  /**
   * Roll back an UPDATE action (restores previous state)
   */
  async _rollbackUpdate(action, resourceType, id, details) {
    if (!id && details?.newState?.id) id = details.newState.id;
    if (!id) {
      throw new AppError(`Cannot rollback ${action}: Resource ID could not be identified.`, HttpStatusCodes.BAD_REQUEST);
    }

    const prev = details.previousState;

    switch (resourceType) {
      case 'vehicle':
        if (prev) {
          await pool.query(`
            UPDATE vehicles
            SET registration_number = COALESCE(?, registration_number),
                model_id = COALESCE(?, model_id),
                fuel_type_id = COALESCE(?, fuel_type_id),
                year = COALESCE(?, year),
                capacity = COALESCE(?, capacity),
                current_odometer = COALESCE(?, current_odometer),
                purchase_price = COALESCE(?, purchase_price),
                status = COALESCE(?, status),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.registration_number,
            prev.model_id,
            prev.fuel_type_id,
            prev.year,
            prev.capacity,
            prev.current_odometer,
            prev.purchase_price,
            prev.status,
            id
          ]);
        } else {
          // If no full previous snapshot, restore to default ACTIVE state
          await pool.query("UPDATE vehicles SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?", [id]);
        }
        break;

      case 'driver':
        if (prev) {
          await pool.query(`
            UPDATE drivers
            SET full_name = COALESCE(?, full_name),
                license_number = COALESCE(?, license_number),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                status = COALESCE(?, status),
                license_expiry = COALESCE(?, license_expiry),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.full_name,
            prev.license_number,
            prev.phone,
            prev.email,
            prev.status,
            prev.license_expiry,
            id
          ]);
        } else {
          await pool.query("UPDATE drivers SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?", [id]);
        }
        break;

      case 'trip':
        if (prev) {
          await pool.query(`
            UPDATE trips
            SET source_location = COALESCE(?, source_location),
                destination_location = COALESCE(?, destination_location),
                cargo_weight_kg = COALESCE(?, cargo_weight_kg),
                status = COALESCE(?, status),
                vehicle_id = COALESCE(?, vehicle_id),
                driver_id = COALESCE(?, driver_id),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.source_location,
            prev.destination_location,
            prev.cargo_weight_kg,
            prev.status,
            prev.vehicle_id,
            prev.driver_id,
            id
          ]);
        } else {
          await pool.query("UPDATE trips SET status = 'DRAFT', updated_at = NOW() WHERE id = ?", [id]);
        }
        break;

      case 'maintenance':
        if (prev) {
          await pool.query(`
            UPDATE maintenance_logs
            SET maintenance_type = COALESCE(?, maintenance_type),
                cost = COALESCE(?, cost),
                status = COALESCE(?, status),
                scheduled_date = COALESCE(?, scheduled_date),
                completed_date = COALESCE(?, completed_date),
                notes = COALESCE(?, notes),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.maintenance_type,
            prev.cost,
            prev.status,
            prev.scheduled_date,
            prev.completed_date,
            prev.notes,
            id
          ]);
        }
        break;

      case 'fuel':
        if (prev) {
          await pool.query(`
            UPDATE fuel_logs
            SET quantity_liters = COALESCE(?, quantity_liters),
                total_cost = COALESCE(?, total_cost),
                odometer_reading = COALESCE(?, odometer_reading),
                receipt_number = COALESCE(?, receipt_number),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.quantity_liters,
            prev.total_cost,
            prev.odometer_reading,
            prev.receipt_number,
            id
          ]);
        }
        break;

      case 'expense':
        if (prev) {
          await pool.query(`
            UPDATE expenses
            SET category = COALESCE(?, category),
                amount = COALESCE(?, amount),
                payment_method = COALESCE(?, payment_method),
                payment_status = COALESCE(?, payment_status),
                description = COALESCE(?, description),
                receipt_number = COALESCE(?, receipt_number),
                updated_at = NOW()
            WHERE id = ?
          `, [
            prev.category,
            prev.amount,
            prev.payment_method,
            prev.payment_status,
            prev.description,
            prev.receipt_number,
            id
          ]);
        }
        break;

      default:
        throw new AppError(`Rollback update not supported for '${resourceType}'.`, HttpStatusCodes.BAD_REQUEST);
    }
  },

  /**
   * Roll back a DELETE action (re-inserts the deleted record)
   */
  async _rollbackDelete(action, resourceType, id, details) {
    const prev = details.previousState;
    if (!prev) {
      throw new AppError(
        `Cannot resurrect deleted ${resourceType}: previous state snapshot was not captured for this historic entry.`,
        HttpStatusCodes.BAD_REQUEST
      );
    }

    switch (resourceType) {
      case 'vehicle':
        await pool.query(`
          INSERT INTO vehicles (id, registration_number, model_id, fuel_type_id, year, capacity, current_odometer, purchase_price, status, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE'
        `, [
          prev.id || id,
          prev.registration_number,
          prev.model_id,
          prev.fuel_type_id,
          prev.year,
          prev.capacity,
          prev.current_odometer,
          prev.purchase_price,
          prev.status || 'ACTIVE',
          prev.created_by || 1
        ]);
        break;

      case 'driver':
        await pool.query(`
          INSERT INTO drivers (id, full_name, employee_id, license_number, license_expiry, phone, email, status, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE'
        `, [
          prev.id || id,
          prev.full_name,
          prev.employee_id || `EMP-${Date.now()}`,
          prev.license_number,
          prev.license_expiry,
          prev.phone,
          prev.email,
          prev.status || 'ACTIVE',
          prev.created_by || 1
        ]);
        break;

      case 'trip':
        await pool.query(`
          INSERT INTO trips (id, trip_number, vehicle_id, driver_id, source_location, destination_location, scheduled_start, cargo_weight_kg, status, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET status = 'DRAFT'
        `, [
          prev.id || id,
          prev.trip_number || `TRP-${Date.now()}`,
          prev.vehicle_id,
          prev.driver_id,
          prev.source_location,
          prev.destination_location,
          prev.scheduled_start || new Date(),
          prev.cargo_weight_kg,
          prev.status || 'DRAFT',
          prev.created_by || 1
        ]);
        break;

      case 'maintenance':
        await pool.query(`
          INSERT INTO maintenance_logs (id, vehicle_id, maintenance_type, scheduled_date, completed_date, cost, status, notes, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET status = 'SCHEDULED'
        `, [
          prev.id || id,
          prev.vehicle_id,
          prev.maintenance_type,
          prev.scheduled_date,
          prev.completed_date,
          prev.cost,
          prev.status,
          prev.notes,
          prev.created_by || 1
        ]);
        break;

      case 'fuel':
        await pool.query(`
          INSERT INTO fuel_logs (id, vehicle_id, trip_id, fuel_type_id, quantity_liters, total_cost, odometer_reading, receipt_number, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          prev.id || id,
          prev.vehicle_id,
          prev.trip_id,
          prev.fuel_type_id,
          prev.quantity_liters,
          prev.total_cost,
          prev.odometer_reading,
          prev.receipt_number,
          prev.created_by || 1
        ]);
        break;

      case 'expense':
        await pool.query(`
          INSERT INTO expenses (id, expense_number, category, vehicle_id, driver_id, trip_id, amount, payment_method, payment_status, description, receipt_number, expense_date, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          prev.id || id,
          prev.expense_number || `EXP-${Date.now()}`,
          prev.category,
          prev.vehicle_id,
          prev.driver_id,
          prev.trip_id,
          prev.amount,
          prev.payment_method,
          prev.payment_status,
          prev.description,
          prev.receipt_number,
          prev.expense_date || new Date(),
          prev.created_by || 1
        ]);
        break;

      default:
        throw new AppError(`Rollback delete not supported for '${resourceType}'.`, HttpStatusCodes.BAD_REQUEST);
    }
  }
};

export default rollbackService;
