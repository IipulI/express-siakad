// import express from 'express';
// import * as GrupMkController from '../../controllers/akademik/grup-mk.controller.js';

// const router = express.Router();

// // GET data dropdown filter (Tahun Kurikulum & Grup MK)
// router.get('/options', GrupMkController.getOptions);

// // GET isi tabel (parameter query: ?kurikulumId=...&grupId=...)
// router.get('/datatable', GrupMkController.getTableData);

// // GET daftar MK yang belum masuk grup manapun untuk input search
// router.get('/search-mk', GrupMkController.getSearchOptions);

// // POST masukkan MK ke grup (body JSON: { "mkId": "...", "grupId": "..." })
// router.post('/set', GrupMkController.saveToGroup);

// // DELETE keluarkan MK dari grup
// router.delete('/remove/:mkId', GrupMkController.removeFromGroup);

// export default router;
import express from 'express';
import * as GrupMkController from '../../controllers/akademik/grup-mk.controller.js';
import { validateGrupMkTable, validateSetGrup } from '../../validators/grup-mk.validator.js';

const router = express.Router();

router.get('/options', GrupMkController.getOptions);
router.get('/datatable', validateGrupMkTable, GrupMkController.getTableData);
router.get('/search-mk', GrupMkController.getSearchOptions);
router.post('/set', validateSetGrup, GrupMkController.saveToGroup);
router.delete('/remove/:mkId', GrupMkController.removeFromGroup);

export default router;