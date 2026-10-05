import pool from './db.js';

/**
 * Seed realistic, meaningful analytics data for TransitOps (400-500 entries)
 * Across Vendors, Fuel Stations, Vehicles, Drivers, Trips, Fuel Logs, Maintenance, and Expenses.
 */
async function seedAnalyticsData() {
  console.log('--- Starting TransitOps Meaningful Analytics Seeder ---');

  // 1. Get Admin User ID
  const [adminUsers] = await pool.query("SELECT id FROM users WHERE email = 'admin@transitops.com' LIMIT 1");
  const adminId = adminUsers[0]?.id || 1;
  console.log(`Using created_by user ID: ${adminId}`);

  // 2. Insert Vendors
  console.log('Seeding Vendors...');
  const vendorsData = [
    ['Tata Authorized Commercial Workshop', '9820199101', 'service@tata-commercial.in', 'Thane West Industrial Zone', 'MAINTENANCE', 1],
    ['Ashok Leyland QuickService Hub', '9845088202', 'support@leylandquick.in', 'Peenya Industrial Area, Bangalore', 'MAINTENANCE', 1],
    ['Bosch Commercial Vehicle Hub', '9811077303', 'fleet@bosch-delhi.in', 'Okhla Phase 2, New Delhi', 'MAINTENANCE', 1],
    ['TVS Commercial Mobility Center', '9840066404', 'service@tvs-mobility.in', 'Ambattur Industrial Estate, Chennai', 'MAINTENANCE', 1],
    ['Castrol Professional Express Lube', '9849055505', 'express@castrol-hyd.in', 'Kukatpally Commercial Zone, Hyderabad', 'MAINTENANCE', 1]
  ];

  for (const v of vendorsData) {
    await pool.query(
      `INSERT INTO vendors (name, contact_phone, contact_email, address, vendor_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING`,
      v
    );
  }
  const [allVendors] = await pool.query('SELECT id, name FROM vendors');
  console.log(`Vendors ready: ${allVendors.length}`);

  // 3. Insert Fuel Stations
  console.log('Seeding Fuel Stations...');
  const stationsData = [
    ['Indian Oil Swagat Fuel Hub', 'NH-48 Corridor, Khalapur', 'Navi Mumbai', 'Maharashtra', 18.8211, 73.2845],
    ['Bharat Petroleum Highway Oasis', 'NH-75 Express Highway', 'Kolar', 'Karnataka', 13.1362, 78.1291],
    ['HP Auto Care Express Hub', 'Delhi-Jaipur Expressway', 'Gurugram', 'Haryana', 28.4595, 77.0266],
    ['Shell Smart Fleet Station', 'Whitefield Main Road', 'Bangalore', 'Karnataka', 12.9698, 77.7500],
    ['Reliance Commercial Fuel Port', 'Mumbai-Pune Highway, Talegaon', 'Pune', 'Maharashtra', 18.7302, 73.6738]
  ];

  for (const s of stationsData) {
    await pool.query(
      `INSERT INTO fuel_stations (name, address, city, state, latitude, longitude, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT DO NOTHING`,
      s
    );
  }
  const [allStations] = await pool.query('SELECT id, name FROM fuel_stations');
  console.log(`Fuel stations ready: ${allStations.length}`);

  // 4. Seed Vehicles (22 diverse commercial models)
  console.log('Seeding Vehicles...');
  const [models] = await pool.query('SELECT id, name FROM vehicle_models');
  const [fuels] = await pool.query('SELECT id, code FROM fuel_types');
  const dieselId = fuels.find(f => f.code === 'DIESEL')?.id || 1;
  const cngId = fuels.find(f => f.code === 'CNG')?.id || 3;
  const petrolId = fuels.find(f => f.code === 'PETROL')?.id || 2;
  const electricId = fuels.find(f => f.code === 'ELECTRIC')?.id || 5;

  const getModelId = (namePart) => {
    const found = models.find(m => m.name.toLowerCase().includes(namePart.toLowerCase()));
    return found ? found.id : models[0]?.id || 1;
  };

  const newVehicles = [
    ['MH-12-RN-2041', getModelId('Signa'), dieselId, 2021, 24000, 'White', 'CHAS-IND-9011', 'ENG-TATA-4401', '2027-04-15', '2027-04-15', '2021-04-10', 3450000, 78200, 'ACTIVE', adminId],
    ['DL-01-AX-3819', getModelId('Prima'), dieselId, 2022, 28000, 'Silver', 'CHAS-IND-9012', 'ENG-TATA-4402', '2027-06-20', '2027-06-20', '2022-06-15', 3950000, 54100, 'ACTIVE', adminId],
    ['KA-03-MM-4912', getModelId('Oyster'), dieselId, 2020, 32, 'Yellow', 'CHAS-IND-9013', 'ENG-AL-3301', '2027-03-10', '2027-03-10', '2020-03-01', 2800000, 112000, 'ACTIVE', adminId],
    ['TN-07-BP-8814', getModelId('Bolero Maxi'), dieselId, 2021, 1500, 'White', 'CHAS-IND-9014', 'ENG-MAH-1101', '2026-11-25', '2026-11-25', '2021-11-20', 850000, 68400, 'ACTIVE', adminId],
    ['MH-04-EK-9218', getModelId('Innova'), dieselId, 2022, 7, 'Silver', 'CHAS-IND-9015', 'ENG-TOY-8801', '2027-08-14', '2027-08-14', '2022-08-01', 2450000, 42300, 'ACTIVE', adminId],
    ['HR-26-CV-1102', getModelId('Signa'), dieselId, 2020, 22000, 'Blue', 'CHAS-IND-9016', 'ENG-TATA-4403', '2026-12-18', '2026-12-18', '2020-12-05', 3300000, 126400, 'IN_MAINTENANCE', adminId],
    ['GJ-01-TR-7451', getModelId('Super Carry'), cngId, 2022, 1200, 'White', 'CHAS-IND-9017', 'ENG-MAR-7701', '2027-01-22', '2027-01-22', '2022-01-15', 650000, 38900, 'ACTIVE', adminId],
    ['KA-01-AB-6623', getModelId('Starbus'), dieselId, 2021, 45, 'Blue/White', 'CHAS-IND-9018', 'ENG-TATA-5501', '2027-05-19', '2027-05-19', '2021-05-02', 3200000, 89100, 'ACTIVE', adminId],
    ['DL-03-GH-5541', getModelId('Prima'), dieselId, 2023, 26000, 'Black', 'CHAS-IND-9019', 'ENG-TATA-4404', '2027-09-30', '2027-09-30', '2023-09-12', 4200000, 31200, 'ACTIVE', adminId],
    ['MH-14-LK-3329', getModelId('Winger'), cngId, 2021, 12, 'White', 'CHAS-IND-9020', 'ENG-TATA-6601', '2027-02-28', '2027-02-28', '2021-02-14', 1650000, 74300, 'ACTIVE', adminId],
    ['TS-09-PQ-8871', getModelId('Scorpio'), dieselId, 2022, 7, 'Black', 'CHAS-IND-9021', 'ENG-MAH-2201', '2027-07-04', '2027-07-04', '2022-06-25', 1950000, 48200, 'ACTIVE', adminId],
    ['WB-02-MN-4419', getModelId('Signa'), dieselId, 2020, 24000, 'Yellow', 'CHAS-IND-9022', 'ENG-TATA-4405', '2026-10-30', '2026-10-30', '2020-10-15', 3250000, 142100, 'ACTIVE', adminId],
    ['TN-02-RS-6611', getModelId('Viking'), dieselId, 2021, 54, 'White/Green', 'CHAS-IND-9023', 'ENG-AL-4401', '2027-04-05', '2027-04-05', '2021-03-20', 3600000, 94600, 'ACTIVE', adminId],
    ['KA-04-UV-7734', getModelId('Bolero Power+'), dieselId, 2022, 5, 'White', 'CHAS-IND-9024', 'ENG-MAH-3301', '2027-08-11', '2027-08-11', '2022-07-30', 1100000, 36400, 'ACTIVE', adminId],
    ['MH-46-XY-2290', getModelId('LPT 1918'), dieselId, 2021, 19000, 'Red', 'CHAS-IND-9025', 'ENG-TATA-7701', '2027-03-25', '2027-03-25', '2021-03-10', 2750000, 83500, 'ACTIVE', adminId],
    ['DL-08-KL-1289', getModelId('Ertiga'), cngId, 2023, 7, 'Silver', 'CHAS-IND-9026', 'ENG-MAR-8801', '2027-10-15', '2027-10-15', '2023-10-01', 1250000, 24500, 'ACTIVE', adminId],
    ['GJ-06-OP-9031', getModelId('Signa'), dieselId, 2021, 24000, 'White', 'CHAS-IND-9027', 'ENG-TATA-4406', '2027-05-12', '2027-05-12', '2021-04-25', 3400000, 77800, 'ACTIVE', adminId],
    ['HR-55-JK-4482', getModelId('Super Carry'), petrolId, 2022, 1000, 'White', 'CHAS-IND-9028', 'ENG-MAR-9901', '2027-06-08', '2027-06-08', '2022-05-20', 600000, 41200, 'ACTIVE', adminId],
    ['TS-07-CD-3312', getModelId('Starbus Ultra 54'), dieselId, 2020, 54, 'White/Blue', 'CHAS-IND-9029', 'ENG-TATA-5502', '2026-11-15', '2026-11-15', '2020-11-01', 3750000, 138900, 'IN_MAINTENANCE', adminId],
    ['KA-51-EF-8845', getModelId('Innova'), dieselId, 2023, 7, 'White', 'CHAS-IND-9030', 'ENG-TOY-8802', '2027-11-10', '2027-11-10', '2023-10-25', 2600000, 18900, 'ACTIVE', adminId],
    ['MH-02-GH-7761', getModelId('Bolero Maxi'), dieselId, 2022, 1500, 'Silver', 'CHAS-IND-9031', 'ENG-MAH-1102', '2027-07-19', '2027-07-19', '2022-07-01', 890000, 49700, 'ACTIVE', adminId],
    ['DL-04-QR-5590', getModelId('Prima'), dieselId, 2022, 28000, 'Orange', 'CHAS-IND-9032', 'ENG-TATA-4407', '2027-08-30', '2027-08-30', '2022-08-15', 4100000, 61400, 'ACTIVE', adminId]
  ];

  for (const v of newVehicles) {
    await pool.query(
      `INSERT INTO vehicles (
        registration_number, model_id, fuel_type_id, year, capacity, color,
        chassis_number, engine_number, insurance_expiry, license_expiry,
        purchase_date, purchase_price, current_odometer, status, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (registration_number) DO UPDATE SET current_odometer = EXCLUDED.current_odometer`,
      v
    );
  }
  const [allVehicles] = await pool.query('SELECT id, registration_number, current_odometer, fuel_type_id FROM vehicles');
  console.log(`Vehicles ready in DB: ${allVehicles.length}`);

  // 5. Seed Drivers (16 drivers)
  console.log('Seeding Drivers...');
  const newDrivers = [
    ['DRV-1003', 'Rajesh Sharma', '+91 98201 11021', 'DL-0420160019281', '2029-05-15', 'HEAVY_COMMERCIAL', '2019-04-10', 'AVAILABLE', adminId],
    ['DRV-1004', 'Vikram Singh', '+91 98450 22032', 'MH-1420170023419', '2028-11-20', 'HEAVY_COMMERCIAL', '2018-08-15', 'AVAILABLE', adminId],
    ['DRV-1005', 'Amit Yadav', '+91 98110 33043', 'DL-0120180038172', '2029-02-10', 'HEAVY_COMMERCIAL', '2020-01-20', 'AVAILABLE', adminId],
    ['DRV-1006', 'Gurpreet Gill', '+91 98720 44054', 'PB-0820150049281', '2028-09-18', 'HEAVY_COMMERCIAL', '2017-06-12', 'AVAILABLE', adminId],
    ['DRV-1007', 'Mohammed Rizwan', '+91 98490 55065', 'TS-0920190051283', '2030-01-25', 'COMMERCIAL_PASSENGER', '2019-11-05', 'AVAILABLE', adminId],
    ['DRV-1008', 'Suresh Nair', '+91 98470 66076', 'KL-0720180062391', '2029-07-14', 'COMMERCIAL_PASSENGER', '2018-03-22', 'AVAILABLE', adminId],
    ['DRV-1009', 'Anand Verma', '+91 98300 77087', 'WB-0120200073402', '2030-04-30', 'LIGHT_COMMERCIAL', '2021-02-18', 'AVAILABLE', adminId],
    ['DRV-1010', 'Dinesh Patel', '+91 98250 88098', 'GJ-0120170084513', '2028-12-10', 'HEAVY_COMMERCIAL', '2018-09-01', 'AVAILABLE', adminId],
    ['DRV-1011', 'Manoj Gupta', '+91 98100 99109', 'UP-3220190095624', '2029-10-05', 'HEAVY_COMMERCIAL', '2020-05-15', 'AVAILABLE', adminId],
    ['DRV-1012', 'Pradeep Reddy', '+91 98480 11210', 'AP-0920180106735', '2029-08-22', 'HEAVY_COMMERCIAL', '2019-07-10', 'AVAILABLE', adminId],
    ['DRV-1013', 'Santosh Patil', '+91 98220 22321', 'MH-1220200117846', '2030-06-18', 'COMMERCIAL_PASSENGER', '2021-04-12', 'AVAILABLE', adminId],
    ['DRV-1014', 'Harish Joshi', '+91 98290 33432', 'RJ-1420190128957', '2029-11-30', 'LIGHT_COMMERCIAL', '2020-08-25', 'AVAILABLE', adminId],
    ['DRV-1015', 'Arvind Kumar', '+91 98350 44543', 'BR-0120180139068', '2029-03-12', 'HEAVY_COMMERCIAL', '2019-02-28', 'AVAILABLE', adminId],
    ['DRV-1016', 'Deepak Meena', '+91 98140 55654', 'HR-0320210140179', '2031-05-20', 'LIGHT_COMMERCIAL', '2022-01-10', 'AVAILABLE', adminId],
    ['DRV-1017', 'Sunil Pillai', '+91 98460 66765', 'TN-0120190151280', '2030-03-08', 'COMMERCIAL_PASSENGER', '2020-10-15', 'AVAILABLE', adminId],
    ['DRV-1018', 'Rameshwar Tiwari', '+91 98390 77876', 'UP-7020170162391', '2028-10-15', 'HEAVY_COMMERCIAL', '2018-04-05', 'AVAILABLE', adminId]
  ];

  for (const d of newDrivers) {
    await pool.query(
      `INSERT INTO drivers (
        employee_id, full_name, phone, license_number, license_expiry,
        license_class, joining_date, status, created_by
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (employee_id) DO UPDATE SET full_name = EXCLUDED.full_name`,
      d
    );
  }
  const [allDrivers] = await pool.query('SELECT id, full_name FROM drivers');
  console.log(`Drivers ready in DB: ${allDrivers.length}`);

  // 6. Seed Trips (200 trips across the last 12 months)
  console.log('Seeding 200 realistic Trips across 12 months...');
  const routes = [
    { src: 'Mumbai Hub', dest: 'Pune Logistics Park', dist: 150, hours: 3.5 },
    { src: 'Delhi Regional Depot', dest: 'Jaipur Transport Nagar', dist: 280, hours: 5.5 },
    { src: 'Central Depot Bangalore', dest: 'Chennai Port Depot', dist: 345, hours: 6.5 },
    { src: 'Ahmedabad Freight Yard', dest: 'Mumbai Logistics Hub', dist: 530, hours: 9.5 },
    { src: 'Delhi Regional Depot', dest: 'Lucknow Transport Nagar', dist: 555, hours: 8.5 },
    { src: 'Hyderabad Hub', dest: 'Central Depot Bangalore', dist: 570, hours: 10.0 },
    { src: 'Kolkata Port Terminal', dest: 'Patna Freight Depot', dist: 580, hours: 11.0 },
    { src: 'Delhi Regional Depot', dest: 'Chandigarh Logistics Hub', dist: 245, hours: 4.5 },
    { src: 'Chennai Port Depot', dest: 'Coimbatore Inland Depot', dist: 505, hours: 8.5 },
    { src: 'Mumbai Logistics Hub', dest: 'Surat Textile Terminal', dist: 285, hours: 5.5 },
    { src: 'Pune Logistics Park', dest: 'Goa Port Terminal', dist: 450, hours: 9.0 },
    { src: 'Central Depot Bangalore', dest: 'Kochi Container Terminal', dist: 550, hours: 10.5 }
  ];

  const purposes = [
    'Scheduled Inter-Depot Freight Linehaul',
    'Customer Bulk Cargo Consignment Delivery',
    'E-Commerce Regional Fulfillment Restock',
    'Automotive Components Supply Line',
    'Pharmaceutical Cold-Chain Transport',
    'Corporate Staff Inter-Facility Transit',
    'Essential Retail Goods Distribution',
    'Textile Raw Material Freight'
  ];

  // Generate 200 trips distributed evenly across 365 days (from 360 days ago to today)
  const now = Date.now();
  const createdTripIds = [];

  for (let i = 1; i <= 200; i++) {
    const daysAgo = Math.floor(360 - (i * 1.75));
    const tripDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const route = routes[(i - 1) % routes.length];
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const driver = allDrivers[(i - 1) % allDrivers.length];
    const tripNum = `TRP-2026-${String(i).padStart(4, '0')}`;

    const scheduledDeparture = new Date(tripDate);
    scheduledDeparture.setHours(7 + (i % 6), (i * 15) % 60, 0, 0);

    const scheduledArrival = new Date(scheduledDeparture.getTime() + route.hours * 60 * 60 * 1000);

    // Status: Most trips in past are COMPLETED, recent few IN_PROGRESS / SCHEDULED, few CANCELLED
    let status = 'COMPLETED';
    let actualDeparture = new Date(scheduledDeparture.getTime() + ((i % 5) - 2) * 10 * 60 * 1000);
    let actualArrival = new Date(scheduledArrival.getTime() + ((i % 4) - 1) * 20 * 60 * 1000);
    let cancelReason = null;

    if (daysAgo < 2) {
      if (i % 3 === 0) {
        status = 'IN_PROGRESS';
        actualArrival = null;
      } else if (i % 3 === 1) {
        status = 'SCHEDULED';
        actualDeparture = null;
        actualArrival = null;
      }
    } else if (i % 25 === 0) {
      status = 'CANCELLED';
      actualDeparture = null;
      actualArrival = null;
      cancelReason = 'Adverse highway weather alert and route closure by transport authorities.';
    }

    const cargoWeight = (i % 4 === 0) ? 0 : Math.round(2000 + ((i * 373) % 18000));
    const passengerCount = (cargoWeight === 0) ? (15 + (i % 35)) : 0;
    const purpose = purposes[i % purposes.length];

    try {
      const [res] = await pool.query(
        `INSERT INTO trips (
          trip_number, vehicle_id, driver_id, source_location, destination_location,
          scheduled_departure, scheduled_arrival, actual_departure, actual_arrival,
          status, distance_km, passenger_count, cargo_weight_kg, purpose, cancellation_reason, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (trip_number) DO UPDATE SET status = EXCLUDED.status
         RETURNING id`,
        [
          tripNum, vehicle.id, driver.id, route.src, route.dest,
          scheduledDeparture.toISOString(), scheduledArrival.toISOString(),
          actualDeparture ? actualDeparture.toISOString() : null,
          actualArrival ? actualArrival.toISOString() : null,
          status, route.dist, passengerCount, cargoWeight, purpose, cancelReason, adminId
        ]
      );
      if (res[0]?.id) createdTripIds.push({ id: res[0].id, vehicleId: vehicle.id, driverId: driver.id, date: scheduledDeparture, dist: route.dist });
    } catch (e) {
      // Ignore duplicates
    }
  }

  const [allTrips] = await pool.query('SELECT id, vehicle_id, driver_id, distance_km, scheduled_departure FROM trips WHERE status = ?', ['COMPLETED']);
  console.log(`Completed Trips available for analytics: ${allTrips.length}`);

  // 7. Seed Fuel Logs (130 logs tied to trips/vehicles)
  console.log('Seeding 130 Fuel Logs across 12 months with realistic Indian fuel prices...');
  for (let i = 1; i <= 130; i++) {
    const trip = allTrips[(i * 3) % allTrips.length] || allTrips[0];
    const vehicle = allVehicles.find(v => v.id === trip.vehicle_id) || allVehicles[0];
    const station = allStations[(i - 1) % allStations.length];
    
    // Quantity in Litres based on distance: ~3.5 to 5 km/L for trucks, 12-16 km/L for small vehicles
    const km = Number(trip.distance_km) || 350;
    const qty = Math.round((km / (4.2 + (i % 3) * 0.4)) * 10) / 10;
    
    // Indian Diesel rates fluctuated between ₹89.50 and ₹94.50 over past year
    const pricePerUnit = Math.round((89.50 + ((i % 11) * 0.48)) * 100) / 100;
    const totalCost = Math.round(qty * pricePerUnit * 100) / 100;
    
    const fuelingDate = new Date(trip.scheduled_departure);
    fuelingDate.setHours(fuelingDate.getHours() - 1);
    
    const receiptNum = `IOC-${String(100000 + i)}`;
    const odo = 25000 + (i * 950);

    const notesObj = {
      fuelStation: station.name,
      paymentMethod: i % 3 === 0 ? 'UPI' : i % 3 === 1 ? 'Company Account' : 'Card',
      remarks: 'Standard bulk diesel refill before dispatch.'
    };

    try {
      await pool.query(
        `INSERT INTO fuel_logs (
          vehicle_id, driver_id, trip_id, fuel_type_id, fuel_station_id,
          quantity, price_per_unit, total_cost, odometer_reading, fueling_date,
          receipt_number, is_full_tank, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          vehicle.id, trip.driver_id, trip.id, vehicle.fuel_type_id || dieselId, station.id,
          qty, pricePerUnit, totalCost, odo, fuelingDate.toISOString(),
          receiptNum, JSON.stringify(notesObj), adminId
        ]
      );
    } catch (e) {
      // Continue
    }
  }
  const [allFuelLogs] = await pool.query('SELECT count(*) as count FROM fuel_logs');
  console.log(`Fuel logs ready in DB: ${allFuelLogs[0].count}`);

  // 8. Seed Maintenance Logs (65 realistic records)
  console.log('Seeding 65 Maintenance records across vehicles...');
  const maintenanceTypes = ['ROUTINE', 'REPAIR', 'INSPECTION', 'EMERGENCY'];
  const maintenanceJobs = [
    { desc: 'Periodic 30,000 km general service, synthetic engine oil flush, and fuel filter renewal.', cost: 8500, type: 'ROUTINE' },
    { desc: 'Brake pad set replacement, front rotor disc facing, and brake fluid bleeding.', cost: 12500, type: 'ROUTINE' },
    { desc: 'Clutch plate and release bearing overhaul due to heavy city transit wear.', cost: 24000, type: 'REPAIR' },
    { desc: 'Air conditioning compressor servicing, gas recharge, and cabin pollen filter replacement.', cost: 7800, type: 'ROUTINE' },
    { desc: 'Heavy duty Exide commercial 12V 120Ah battery renewal with terminal anti-corrosion coating.', cost: 14200, type: 'REPAIR' },
    { desc: 'Six-wheel tire rotation, digital dynamic wheel balancing, and front suspension alignment.', cost: 4200, type: 'ROUTINE' },
    { desc: 'Emergency radiator hose replacement and coolant leak pressure testing on highway corridor.', cost: 5800, type: 'EMERGENCY' },
    { desc: 'Pre-monsoon comprehensive electrical diagnostic, wiper motor overhaul, and headlight focus.', cost: 3600, type: 'INSPECTION' },
    { desc: 'Rear axle suspension leaf spring bush replacement and U-bolt retorquing.', cost: 16500, type: 'REPAIR' },
    { desc: 'Turbocharger intake pipe cleaning and EGR valve carbon decoke service.', cost: 18900, type: 'REPAIR' },
    { desc: 'Full chassis grease lubrication, propellor shaft cross-joint servicing, and underbody wash.', cost: 3200, type: 'ROUTINE' },
    { desc: 'Major 100,000 km preventive overhaul: timing belt, water pump, and drive pulleys replacement.', cost: 38500, type: 'ROUTINE' }
  ];

  for (let i = 1; i <= 65; i++) {
    const vehicle = allVehicles[(i * 2) % allVehicles.length];
    const vendor = allVendors[(i - 1) % allVendors.length];
    const job = maintenanceJobs[(i - 1) % maintenanceJobs.length];
    
    const daysAgo = Math.floor(350 - (i * 5.2));
    const startDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (1 + (i % 3)) * 24 * 60 * 60 * 1000);
    
    const status = daysAgo > 3 ? 'COMPLETED' : 'IN_PROGRESS';
    const odo = 30000 + (i * 1200);

    const notesObj = {
      serviceCenter: vendor.name,
      technicianName: ['Rajesh Kumar', 'Santosh Sharma', 'Praveen Yadav', 'Muralidhar Rao', 'Abdul Kareem'][i % 5],
      remarks: 'Work order executed under fleet service contract.'
    };

    try {
      await pool.query(
        `INSERT INTO maintenance_logs (
          vehicle_id, vendor_id, maintenance_type, description, cost,
          odometer_reading, start_date, end_date, status, notes, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          vehicle.id, vendor.id, job.type, job.desc, job.cost,
          odo, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0],
          status, JSON.stringify(notesObj), adminId
        ]
      );
    } catch (e) {
      // Continue
    }
  }
  const [allMaint] = await pool.query('SELECT count(*) as count FROM maintenance_logs');
  console.log(`Maintenance records ready in DB: ${allMaint[0].count}`);

  // 9. Seed Expenses (110 records)
  console.log('Seeding 110 Expenses across categories with Indian Rupees...');
  const expenseTemplates = [
    { cat: 'TOLL', desc: 'FASTag Automated National Highway Toll Deduction - NH48 Express Corridor', min: 450, max: 1850 },
    { cat: 'TOLL', desc: 'Inter-State Commercial Freight Terminal Toll Plaza Clearance', min: 650, max: 2200 },
    { cat: 'OTHER', desc: 'State Transport Department Commercial Goods Transit Entry Permit', min: 1200, max: 3500 },
    { cat: 'SALARY', desc: 'Driver Daily Food & Night Outstation Halting Allowance (Bhatta)', min: 800, max: 1600 },
    { cat: 'INSURANCE', desc: 'Commercial Vehicle Third-Party & Comprehensive Insurance Quarterly Premium', min: 18500, max: 36000 },
    { cat: 'REGISTRATION', desc: 'RTO Annual Fitness Certificate Renewal & Road Safety Audit Fee', min: 3500, max: 6200 },
    { cat: 'REGISTRATION', desc: 'State Commercial Vehicle Road Tax Half-Yearly Installment', min: 12000, max: 24500 },
    { cat: 'MAINTENANCE', desc: 'Emergency Highway Tire Puncture Vulcanizing & Nitrogen Top-up', min: 600, max: 1400 },
    { cat: 'OTHER', desc: 'Depot Fleet High-Pressure Pressure Wash & Disinfection', min: 450, max: 950 },
    { cat: 'OTHER', desc: 'Pollution Under Control (PUC) Bi-Annual Emission Compliance Testing', min: 250, max: 450 }
  ];

  const payMethods = ['UPI', 'BANK_TRANSFER', 'CARD', 'CASH'];

  for (let i = 1; i <= 110; i++) {
    const tmpl = expenseTemplates[(i - 1) % expenseTemplates.length];
    const vehicle = allVehicles[(i * 3) % allVehicles.length];
    const driver = allDrivers[(i - 1) % allDrivers.length];
    const trip = allTrips[(i * 2) % allTrips.length];
    
    const daysAgo = Math.floor(355 - (i * 3.1));
    const expDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const amount = Math.round(tmpl.min + ((i * 123) % (tmpl.max - tmpl.min)));
    const expNum = `EXP-2026-${String(i).padStart(4, '0')}`;
    const rcptNum = `RCP-${String(50000 + i)}`;
    const payMethod = payMethods[i % payMethods.length];
    const payStatus = daysAgo > 5 ? 'PAID' : (i % 2 === 0 ? 'PENDING' : 'PAID');

    try {
      await pool.query(
        `INSERT INTO expenses (
          expense_number, category, vehicle_id, driver_id, trip_id,
          amount, currency, description, receipt_number, expense_date,
          payment_method, payment_status, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?)
         ON CONFLICT (expense_number) DO NOTHING`,
        [
          expNum, tmpl.cat, vehicle.id, driver.id, trip ? trip.id : null,
          amount, tmpl.desc, rcptNum, expDate,
          payMethod, payStatus, adminId
        ]
      );
    } catch (e) {
      // Continue
    }
  }
  const [allExp] = await pool.query('SELECT count(*) as count FROM expenses');
  console.log(`Expenses ready in DB: ${allExp[0].count}`);

  console.log('--- Seeding Completed Successfully! ---');
  process.exit(0);
}

seedAnalyticsData().catch(err => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
