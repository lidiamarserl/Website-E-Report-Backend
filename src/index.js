require('dotenv').config();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const express = require('express');
const app = express();

const middlewareLogReq = require('./middleware/logs');
const upload = require('./middleware/multer');

const testRoute = require('./routes/test');
const departmentRoute = require('./routes/department');
const formRoute = require('./routes/form');
const listFormRoute = require('./routes/listForm');
const listFormReportRoute = require('./routes/listFormReport');
const listFormTableRoute = require('./routes/listFormTable');
const listReportRoute = require('./routes/listReport');
const listTableRoute = require('./routes/listTable');
const reportRoute = require('./routes/report');
const roleRoute = require('./routes/role');
const userRoute = require('./routes/user');
const tableButterTankRoute = require('./routes/table/butterTank');
const tableChallengeTestRoute = require('./routes/table/challengeTest');
const tableChangePressPlateRoute = require('./routes/table/changePressPlate');
const tableCheckMatchRoute = require('./routes/table/checkMatch');
const tableCheckSealingRoute = require('./routes/table/checkSealing');
const tableCheckSewingRoute = require('./routes/table/checkSewing');
const tableCleaningOutputReportRoute = require('./routes/table/cleaningOutputReport');
const tableCocoaRecordRoute = require('./routes/table/cocoaRecord');
const tableDeoObservationRoute = require('./routes/table/deoObservation');
const tableDowntimeRoute = require('./routes/table/downtime');
const tableEarlyShiftCheckRoute = require('./routes/table/earlyShiftCheck');
const tableHoldQcRoute = require('./routes/table/holdQc');
const tableMonitoringAreaRoute = require('./routes/table/monitoringArea');
const tableMonitoringDryingMachineRoute = require('./routes/table/monitoringDryingMachine');
const tableMonitoringGlassRoute = require('./routes/table/monitoringGlass');
const tableMonitoringMetalCatcherRoute = require('./routes/table/monitoringMetalCatcher');
const tableMonitoringPolishingRoute = require('./routes/table/monitoringPolishing');
const tableMonitoringPressureFilterDuyvisRoute = require('./routes/table/monitoringPressureFilterDuyvis');
const tableMonitoringProcessProductionRoute = require('./routes/table/monitoringProcessProduction');
const tableMonitoringSiftingRoute = require('./routes/table/monitoringSifting');
const tableMonitoringTemperatureDRoute = require('./routes/table/monitoringTemperatureD');
const tableMonitoringTemperatureRhRoute = require('./routes/table/monitoringTemperatureRh');
const tableObservationReportRoute = require('./routes/table/observationReport');
const tableOutputDeoRoute = require('./routes/table/outputDeo');
const tableOutputPowderRoute = require('./routes/table/outputPowder');
const tableProcessDeodorizeRoute = require('./routes/table/processDeodorize');
const tableProcessFilterButterDuyvisRoute = require('./routes/table/processFilterButterDuyvis');
const tableProcessFilterButterLokalRoute = require('./routes/table/processFilterButterLokal');
const tableProcessTimeRoute = require('./routes/table/processTime');
const tableRejectMonitoringRoute = require('./routes/table/rejectMonitoring');
const tableRoastingSectionRoute = require('./routes/table/roastingSection');
const tableRoastingSectionWpRoute = require('./routes/table/roastingSectionWp');
const tableStartupChecklistEquipmentRoute = require('./routes/table/startupChecklistEquipment');
const tableStartupChecklistItemRoute = require('./routes/table/startupChecklistItem');
const tableStartupChecklistOperasionalRoute = require('./routes/table/startupChecklistOperasional');
const tableTemperingAastedRoute = require('./routes/table/temperingAasted');
const tableTransferRoute = require('./routes/table/transfer');
const tableVerificationScalesRoute = require('./routes/table/verificationScales');
const tableWeighingVerificationRoute = require('./routes/table/weighingVerification');
const tableWinnowingOutputReportRoute = require('./routes/table/winnowingOutputReport');
const tableWinnowingOutputReport2Route = require('./routes/table/winnowingOutputReport2');
const tableWipRoute = require('./routes/table/wip');
const tableWorkinProcessRoute = require('./routes/table/workinProcess');
const tableCondition = require('./routes/table/condition');


const corsOptions = {
  // origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Untuk browser yang memerlukan ini
};

app.use(cors(corsOptions));
app.use(middlewareLogReq); //midlleware
app.use(express.json());

app.use("/api/department", departmentRoute);
app.use("/api/test", testRoute);
app.use("/api/form", formRoute);
app.use("/api/list-form", listFormRoute);
app.use("/api/list-form-report", listFormReportRoute);
app.use("/api/list-form-table", listFormTableRoute);
app.use("/api/list-report", listReportRoute);
app.use("/api/list-table", listTableRoute);
app.use("/api/report", reportRoute);
app.use("/api/role", roleRoute);
app.use("/api/user", userRoute);
app.use("/api/table/butter-tank", tableButterTankRoute);
app.use("/api/table/challenge-test", tableChallengeTestRoute);
app.use("/api/table/change-press-plate", tableChangePressPlateRoute);
app.use("/api/table/check-match", tableCheckMatchRoute);
app.use("/api/table/check-sealing", tableCheckSealingRoute);
app.use("/api/table/check-sewing", tableCheckSewingRoute);
app.use("/api/table/cleaning-output-report", tableCleaningOutputReportRoute);
app.use("/api/table/cocoa-record", tableCocoaRecordRoute);
app.use("/api/table/deo-observation", tableDeoObservationRoute);
app.use("/api/table/downtime", tableDowntimeRoute);
app.use("/api/table/early-shift-check", tableEarlyShiftCheckRoute);
app.use("/api/table/hold-qc", tableHoldQcRoute);
app.use("/api/table/monitoring-area", tableMonitoringAreaRoute);
app.use("/api/table/monitoring-drying-machine", tableMonitoringDryingMachineRoute);
app.use("/api/table/monitoring-glass", tableMonitoringGlassRoute);
app.use("/api/table/monitoring-metal-catcher", tableMonitoringMetalCatcherRoute);
app.use("/api/table/monitoring-polishing", tableMonitoringPolishingRoute);
app.use("/api/table/monitoring-pressure-filter-duyvis", tableMonitoringPressureFilterDuyvisRoute);
app.use("/api/table/monitoring-process-production", tableMonitoringProcessProductionRoute);
app.use("/api/table/monitoring-sifting", tableMonitoringSiftingRoute);
app.use("/api/table/monitoring-temperature-d", tableMonitoringTemperatureDRoute);
app.use("/api/table/monitoring-temperature-rh", tableMonitoringTemperatureRhRoute);
app.use("/api/table/observation-report", tableObservationReportRoute);
app.use("/api/table/output-deo", tableOutputDeoRoute);
app.use("/api/table/output-powder", tableOutputPowderRoute);
app.use("/api/table/process-deodorize", tableProcessDeodorizeRoute);
app.use("/api/table/process-filter-butter-duyvis", tableProcessFilterButterDuyvisRoute);
app.use("/api/table/process-filter-butter-lokal", tableProcessFilterButterLokalRoute);
app.use("/api/table/process-time", tableProcessTimeRoute);
app.use("/api/table/reject-monitoring", tableRejectMonitoringRoute);
app.use("/api/table/roasting-section", tableRoastingSectionRoute);
app.use("/api/table/roasting-section-wp", tableRoastingSectionWpRoute);
app.use("/api/table/startup-checklist-equipment", tableStartupChecklistEquipmentRoute);
app.use("/api/table/startup-checklist-item", tableStartupChecklistItemRoute);
app.use("/api/table/startup-checklist-operasional", tableStartupChecklistOperasionalRoute);
app.use("/api/table/tempering-aasted", tableTemperingAastedRoute);
app.use("/api/table/transfer", tableTransferRoute);
app.use("/api/table/verification-scales", tableVerificationScalesRoute);
app.use("/api/table/weighing-verification", tableWeighingVerificationRoute);
app.use("/api/table/winnowing-output-report", tableWinnowingOutputReportRoute);
app.use("/api/table/winnowing-output-report2", tableWinnowingOutputReport2Route);
app.use("/api/table/wip", tableWipRoute);
app.use("/api/table/workin-process", tableWorkinProcessRoute);
app.use("/api/table/condition", tableCondition);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} and accessible on your network`);
});