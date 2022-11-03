const os = require('os');

const MONGO_PATH = process.env.MONGO_PATH;

const SERVER_URL = process.env.SERVER_URL;

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
