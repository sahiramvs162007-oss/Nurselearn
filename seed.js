/**
 * seed.js — Crea el usuario administrador inicial
 * Uso: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const existe = await User.findOne({ email: 'admin@sena.edu.co' });
  if (existe) {
    console.log('⚠️  El admin ya existe. No se creó nada nuevo.');
    process.exit(0);
  }

  await User.create({
    nombre: 'Administrador SENA',
    email: 'admin@sena.edu.co',
    password: 'Admin1234',
    rol: 'admin'
  });

  console.log('✅ Admin creado:');
  console.log('   Email:    admin@sena.edu.co');
  console.log('   Password: Admin1234');
  console.log('   ⚠️  Cambia la contraseña después del primer login.');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
