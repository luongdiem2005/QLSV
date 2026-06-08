const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./request.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('SV', 'PDT', 'PTC', 'ADMIN'), ctrl.list);
router.post('/', authorize('SV'), ctrl.create);
router.put('/:maDon', authorize('PDT', 'PTC', 'ADMIN'), ctrl.duyet);

module.exports = router;
