const express = require("express");
const path = require("path");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(6000, () => {
      console.log("Server Running at http://localhost:6000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getStateDetails = `
    SELECT 
        state_id AS stateId,
        state_name AS stateName,
        population as population
    FROM   
        state
    ORDER BY
     state_id ASC;`;
  const stateDetails = await db.all(getStateDetails);
  response.send(stateDetails);
});

//API 2
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateOnId = `
    SELECT 
        state_id AS stateId,
        state_name AS stateName,
        population as population
    FROM state 
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateOnId);
  response.send(state);
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO 
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        district_id AS districtId,
        district_name AS districtName,
        state_id AS stateId,
        cases AS cases,
        cured AS cured,
        active AS active,
        deaths AS deaths
    FROM district
    WHERE district_id = ${districtId};`;
  const state = await db.get(getDistrictQuery);
  response.send(state);
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE district_id = ${districtId};`;
  db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const updateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = updateDetails;
  const updateDistrictQuery = `
    UPDATE district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};`;

  await db.run(updateDetails);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCaseDetails = `
    SELECT 
    district.cases AS totalCases,
    district.cured AS totalCured,
    district.active AS totalActive,
    district.deaths AS totalDeaths
    FROM state INNER JOIN district ON state.state_id = district.state_id
    WHERE state.state_id = ${stateId};`;
  const dbResponse = await db.get(getCaseDetails);
  response.send(dbResponse);
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateOnDistrictId = `
    SELECT state.state_name AS stateName
    FROM state INNER JOIN district ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
  const stateName = await db.get(getStateOnDistrictId);
  response.send(stateName);
});

module.exports = app;
