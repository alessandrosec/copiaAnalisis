module.exports = {
  HOST: "localhost",
  USER: "universidad",
  PASSWORD: "rootadmin",
  DB: "XEPDB1",
  dialect: "oracle",
  port: 1521,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
