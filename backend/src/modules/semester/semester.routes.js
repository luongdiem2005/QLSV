const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const ctrl = require('./semester.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('PDT', 'PTC', 'SV'), ctrl.list);
router.get('/:maHKNH', authorize('PDT', 'PTC', 'SV'), ctrl.getOne);
router.post('/', authorize('PDT'), ctrl.create);
router.put('/:maHKNH', authorize('PDT'), ctrl.update);
router.delete('/:maHKNH', authorize('PDT'), ctrl.remove);

module.exports = router;
