const os = require('os');

const local_mongo_path = 'mongodb://kash:kash123@localhost:27017/AgriMatch';

const mongo_atlas_path = 'mongodb+srv://pk:pk1234@cluster0-pgexg.mongodb.net/test?retryWrites=true&w=majority';

const MONGO_PATH = mongo_atlas_path;

const local = 'http://192.168.1.34:3000/';

const server = 'https://api.awlam.com/';

const SERVER_URL = local;

const JWT_KEY = 'secure_agrimatch_key';

const BASE_PATH = os.homedir() + '/AgriMatch/';

const CROP_PIC_URL = BASE_PATH + 'CropsPics/';

const GPA_CERT_URL = BASE_PATH + 'GpaCertPics/';

const PROPIC_URL = BASE_PATH + 'UserProPics/';

module.exports = {
    MONGO_PATH,
    SERVER_URL,
    JWT_KEY,
    CROP_PIC_URL,
    PROPIC_URL,
    GPA_CERT_URL
};
