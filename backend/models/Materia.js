const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
    nombre:   { type: String, required: true, trim: true },
    semestre: { type: String, required: true, trim: true },
    activo:   { type: Boolean, default: true },
});

materiaSchema.index({ semestre: 1 });

module.exports = mongoose.model('Materia', materiaSchema);
