const os = require('os');

const mongo_local_path = 'mongodb://localhost:27017/Agrimatch';

const mongo_server_path = 'mongodb://kash:kash123@localhost:27017/Agrimatch';

const MONGO_PATH = mongo_local_path;

const local = 'http://192.168.8.116:3000/';

const server = 'http://104.197.224.155:3000/';

const SERVER_URL = local;

const JWT_KEY = 'secure_agrimatch_key';

const BASE_PATH = os.homedir() + '/AgriMatch/';

const CROP_PIC_URL = BASE_PATH + 'CropsPics/';

const GPA_CERT_URL = BASE_PATH + 'GpaCertPics/';

const PROPIC_URL = BASE_PATH + 'UserProPics/';

const FEEDBACK_URL = BASE_PATH + 'FeedBack/';

const CHAT_URL = BASE_PATH + 'ChatPics/';

module.exports = {
	MONGO_PATH,
	SERVER_URL,
	JWT_KEY,
	CROP_PIC_URL,
	PROPIC_URL,
	GPA_CERT_URL,
	FEEDBACK_URL,
	CHAT_URL,
};
