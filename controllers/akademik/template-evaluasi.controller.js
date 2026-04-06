import * as TemplateService from "../../services/template-evaluasi.service.js";


export const getListTemplate = async (req, res) => {
    try {
        // Ambil filter dari query parameter (?kurikulumId=...&prodiId=...)
        const filters = {
            kurikulumId: req.query.kurikulumId,
            prodiId: req.query.prodiId,
            jenisMk: req.query.jenisMk
        };

        const data = await TemplateService.getListTemplate(filters);

        return res.status(200).json({
            status: 200,
            message: "Berhasil mengambil daftar template evaluasi",
            data: data,
            errors: {}
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
    }
};

export const getDetailTemplate = async (req, res) => {
    try {
        const { kurikulumId, prodiId, jenisMk } = req.query; // Ambil dari query params URL
        
        if (!kurikulumId || !prodiId || !jenisMk) {
            return res.status(400).json({ status: 400, message: "Parameter kurikulumId, prodiId, dan jenisMk wajib diisi", data: {}, errors: {} });
        }

        const data = await TemplateService.getDetailTemplate(kurikulumId, prodiId, jenisMk);
        
        return res.status(200).json({
            status: 200,
            message: "Berhasil mengambil detail template evaluasi",
            data: data,
            errors: {}
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
    }
};

export const saveTemplate = async (req, res) => {
    try {
        // Payload dari body (contoh JSON ada di bawah)
        const payload = req.body; 

        if (!payload.siakTahunKurikulumId || !payload.siakProgramStudiId || !payload.jenisMataKuliah) {
            return res.status(400).json({ status: 400, message: "Data utama tidak lengkap", data: {}, errors: {} });
        }

        await TemplateService.upsertTemplate(payload);

        return res.status(201).json({
            status: 201,
            message: "Template evaluasi berhasil disimpan",
            data: payload,
            errors: {}
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
    }
};
export const deleteTemplate = async (req, res) => {
    try {
        // Ambil ID-nya dari query URL (karena DELETE biasanya nggak pakai body)
        const { kurikulumId, prodiId, jenisMk } = req.query;

        if (!kurikulumId || !prodiId || !jenisMk) {
            return res.status(400).json({ status: 400, message: "Parameter kurikulumId, prodiId, dan jenisMk wajib diisi", data: {}, errors: {} });
        }

        const deletedCount = await TemplateService.deleteTemplate(kurikulumId, prodiId, jenisMk);

        if (deletedCount === 0) {
            return res.status(404).json({ status: 404, message: "Data template tidak ditemukan", data: {}, errors: {} });
        }

        return res.status(200).json({
            status: 200,
            message: "Berhasil menghapus template evaluasi",
            data: { totalDihapus: deletedCount },
            errors: {}
        });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message, data: {}, errors: {} });
    }
};
