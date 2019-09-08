const os = require("os");

const mongo_local_path = "mongodb://localhost:27017/Agrimatch";

const mongo_atlas_path =
  "mongodb+srv://pk:pk1234@cluster0-pgexg.mongodb.net/test?retryWrites=true&w=majority";

const MONGO_PATH = mongo_local_path;

const local = "http://192.168.8.116:3000/";

const server = "";

const SERVER_URL = local;

const JWT_KEY = "secure_agrimatch_key";

const BASE_PATH = os.homedir() + "/AgriMatch/";

const CROP_PIC_URL = BASE_PATH + "CropsPics/";

const GPA_CERT_URL = BASE_PATH + "GpaCertPics/";

const PROPIC_URL = BASE_PATH + "UserProPics/";

module.exports = {
  MONGO_PATH,
  SERVER_URL,
  JWT_KEY,
  CROP_PIC_URL,
  PROPIC_URL,
  GPA_CERT_URL
};
