const gulp = require('gulp');
const admin = require("firebase-admin");
const fs = require('fs');
const collectionName = "announcements";

gulp.task('push-announcements', [], async () => {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIRESTORE_URL,
    });

    const updateFilePath = './dist/pim/updates.json';
    await deleteAnnouncements(updateFilePath);
    await pushAnnouncements(updateFilePath);
});

async function pushAnnouncements(updateFilepath) {
    const announcements = admin.firestore().collection(collectionName);

    const rawData = fs.readFileSync(updateFilepath);
    const data = JSON.parse(rawData);

    await Promise.all(data.map(async (announcement) => {
        await announcements.doc(announcement.id).set(announcement);
    }));
}


/**
 * It's possible that we would like to delete an announcement due to a mistake.
 *
 * This function deletes only announcements that does not exist anymore.
 *
 * Another solution would be to delete all the docs in firestore, and re-insert everything. As there is no transaction,
 * it would be possible during a small amount of time to have inconsistent data when it pushes the announcements.
 * It could impact negatively the experience in the PIM and that's why it does delta delete instead.
 */
async function deleteAnnouncements(updateFilepath) {
    const idsInFirestore = await getIdsInFirestore();
    const idsInFile = getIdsInFile(updateFilepath);

    const deletedIds = idsInFirestore.filter(id => !idsInFile.includes(id));
    const announcements = admin.firestore().collection(collectionName);

    await Promise.all(deletedIds.map(async (id) => {
        await announcements.doc(id).delete();
    }));
}

async function getIdsInFirestore() {
    const announcements = await admin.firestore().collection(collectionName).get();
    const ids = [];

    announcements.forEach(announcement => {
        ids.push(announcement.id);
    });

    return ids;
}

function getIdsInFile(updateFilepath) {
    const rawData = fs.readFileSync(updateFilepath);
    const data = JSON.parse(rawData);

    return data.map(obj => obj.id);
}
