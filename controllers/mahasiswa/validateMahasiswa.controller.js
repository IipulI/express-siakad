import models from '../../models/index.js';

const { Mahasiswa, UnitKerja, ProgramStudi } = models;

export const validateNpm = async (req, res) => {
    try {
        const { npm } = req.query;

        if (!npm) {
            return res.status(400).json({
                status: 400,
                valid: false,
                message: 'NPM wajib diisi.',
            });
        }

        const mahasiswa = await Mahasiswa.findOne({
            where: { npm },
            attributes: ['id', 'nama', 'npm'],
            include: {
                attributes: ['id', 'kode', 'nama'],
                model: ProgramStudi,
                as: 'programStudi',
                include: {
                    attributes: ['id', 'kode', 'nama'],
                    model: UnitKerja,
                    as: 'unitKerja'
                }
            }
        });

        if (!mahasiswa) {
            return res.status(404).json({
                status: 404,
                valid: false,
                message: 'NPM tidak ditemukan di SIAKAD.',
            });
        }

        return res.json({
            status: 200,
            valid: true,
            message: 'NPM valid.',
            data: {
                nama: mahasiswa.nama,
                npm:  mahasiswa.npm,
                unitId: mahasiswa.programStudi.unitKerja.id,
                unitName: mahasiswa.programStudi.unitKerja.nama,
                unitKode: mahasiswa.programStudi.unitKerja.kode,
            },
        });
    } catch (error) {
        console.error('[validateNpm]', error.message);
        return res.status(500).json({
            status: 500,
            valid: false,
            message: 'Gagal memvalidasi NPM.',
        });
    }
};