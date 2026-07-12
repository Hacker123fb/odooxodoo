import reportService from '../services/report.service.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const reportController = {
  /**
   * GET /api/v1/reports
   * Retrieves aggregated analytical operations reports.
   */
  getReport: asyncHandler(async (req, res) => {
    const { 
      type,
      startDate,
      endDate,
      vehicleId,
      driverId,
      status,
      category,
      fuelTypeId
    } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Report type parameter is required.'
      });
    }

    // Assemble filters sanitizing numbers
    const filters = {
      startDate: startDate || null,
      endDate: endDate || null,
      vehicleId: vehicleId ? parseInt(vehicleId, 10) : null,
      driverId: driverId ? parseInt(driverId, 10) : null,
      status: status || null,
      category: category || null,
      fuelTypeId: fuelTypeId ? parseInt(fuelTypeId, 10) : null
    };

    const reportData = await reportService.getReportData(type, filters);
    
    return res.ok(reportData, `${type} report generated successfully.`);
  })
};

export default reportController;
