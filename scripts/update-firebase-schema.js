/**
 * Script de migración para actualizar el esquema de Firebase
 * Agrega campos de favoritos a usuarios existentes
 *
 * Ejecutar con: node scripts/update-firebase-schema.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin (asegúrate de tener las credenciales configuradas)
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
} catch (error) {
    console.error('Error inicializando Firebase Admin:', error.message);
    console.log('\nAsegúrate de tener las credenciales de Firebase configuradas.');
    console.log('Ejecuta: export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"');
    process.exit(1);
}

const db = admin.firestore();

async function updateUserSchema() {
    console.log('🔄 Actualizando esquema de usuarios...\n');

    try {
        const usersSnapshot = await db.collection('user').get();

        if (usersSnapshot.empty) {
            console.log('❌ No se encontraron usuarios en la base de datos.');
            return;
        }

        let updatedCount = 0;
        let skippedCount = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();

            // Verificar si ya tiene los campos de favoritos
            if (userData.favoriteTutors || userData.favoriteCourses) {
                console.log(`⏭️  Usuario ${doc.id} ya tiene campos de favoritos, omitiendo...`);
                skippedCount++;
                continue;
            }

            // Agregar campos de favoritos
            await doc.ref.update({
                favoriteTutors: [],
                favoriteCourses: []
            });

            console.log(`✅ Usuario ${doc.id} actualizado con campos de favoritos`);
            updatedCount++;
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   - Usuarios actualizados: ${updatedCount}`);
        console.log(`   - Usuarios omitidos: ${skippedCount}`);
        console.log(`   - Total de usuarios: ${usersSnapshot.size}`);
        console.log('\n✨ Migración completada exitosamente!\n');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        throw error;
    }
}

async function addBasePriceToCourses() {
    console.log('🔄 Agregando base_price a materias...\n');

    try {
        const coursesSnapshot = await db.collection('course').get();

        if (coursesSnapshot.empty) {
            console.log('❌ No se encontraron materias en la base de datos.');
            return;
        }

        let updatedCount = 0;
        let skippedCount = 0;

        // Precios base sugeridos por facultad
        const basePricesByFaculty = {
            'Ciencias': 50000,
            'Ingeniería': 55000,
            'Economía': 45000,
            'Derecho': 48000,
            'Medicina': 60000,
            'default': 50000
        };

        for (const doc of coursesSnapshot.docs) {
            const courseData = doc.data();

            // Verificar si ya tiene base_price
            if (courseData.base_price !== undefined) {
                console.log(`⏭️  Materia ${doc.id} ya tiene base_price, omitiendo...`);
                skippedCount++;
                continue;
            }

            // Determinar precio base según facultad
            const basePrice = basePricesByFaculty[courseData.faculty] || basePricesByFaculty.default;

            await doc.ref.update({
                base_price: basePrice
            });

            console.log(`✅ Materia ${doc.id} (${courseData.name}) actualizada con base_price: $${basePrice.toLocaleString()} COP`);
            updatedCount++;
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   - Materias actualizadas: ${updatedCount}`);
        console.log(`   - Materias omitidas: ${skippedCount}`);
        console.log(`   - Total de materias: ${coursesSnapshot.size}`);
        console.log('\n✨ Actualización completada exitosamente!\n');

    } catch (error) {
        console.error('❌ Error actualizando materias:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Iniciando migración de Firebase...\n');
    console.log('=' .repeat(50));
    console.log('\n');

    try {
        // Actualizar usuarios
        await updateUserSchema();

        console.log('\n');
        console.log('=' .repeat(50));
        console.log('\n');

        // Actualizar materias
        await addBasePriceToCourses();

        console.log('\n');
        console.log('=' .repeat(50));
        console.log('\n✅ ¡Migración completada exitosamente!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error durante la migración:', error);
        process.exit(1);
    }
}

// Ejecutar migración
main();
