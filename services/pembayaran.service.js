import model from '../models/index.js'

const {
    Mahasiswa,
    KrsMahasiswa,
    RincianKrsMahasiswa,
    PeriodeAkademik,
    KelasKuliah,
    MataKuliah,
} = model

export const getPembayaranCard = async(mahasiswa) => {
    const mahasiswaExist = await Mahasiswa.findByPk(mahasiswa.id, {
        attributes: ['id'],
    })
    if (!mahasiswaExist) {
        throw new Error('Mahasiswa tidak ditemukan')
    }

    const { totalBiaya } = await calculateTagihanSks(mahasiswa.id)

    // 3. Map ke IInfoTagihan
    return {
        totalTagihan: totalBiaya,
        totalLunas: 0,
        sisaTagihan: totalBiaya,
        tanggalTenggat: new Date().toISOString().split('T')[0],
    }
}

export const getPembayaranAktif = async (mahasiswa) => {
    // 1. Validasi Mahasiswa
    const mahasiswaExist = await Mahasiswa.findByPk(mahasiswa.id, { attributes: ['id', 'npm'] })
    if (!mahasiswaExist) throw new Error('Mahasiswa tidak ditemukan')

    // 2. Ambil data hitungan static yang sama
    const { totalBiaya } = await calculateTagihanSks(mahasiswa.id)

    // Jika tidak ada tagihan, bisa return array kosong atau sesuaikan dengan kebutuhan
    if (totalBiaya === 0) return []

    // 3. Map ke ITagihan
    const response = {
        kodeInvoice: `INV-SKS-${Date.now()}`, // Generated dummy invoice
        metodeBayar: null,
        namaPeriode: "Semester Ganjil 2026/2027", // Static for now
        tanggalTenggat: new Date().toISOString().split('T')[0],
        tanggalBayar: null,
        kodeKomponen: "BIAYA_SKS",
        namaTagihan: "SKS",
        nominalTagihan: totalBiaya,
        lunas: "belum lunas"
    }

    // Biasanya endpoint tagihan aktif mengembalikan array
    return [response]
}

// This is your shared internal function
const calculateTagihanSks = async (mahasiswaId) => {
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    })
    if (!activePeriod) {
        throw new Error('Tidak ada periode akademik aktif yang ditemukan')
    }

    const krsMahasiswaDetail = await KrsMahasiswa.findOne({
        where: {
            siakPeriodeAkademikId: activePeriod.id,
            siakMahasiswaId: mahasiswaId,
            status: 'Diverifikasi'
        },
        include: {
            attributes: ['id', 'siakKelasKuliahId'],
            model: RincianKrsMahasiswa,
            as: 'rincianKrsMahasiswa',
            include: {
                attributes: ['id', 'siakMataKuliahId'],
                model: KelasKuliah,
                as: 'kelasKuliah',
                include: {
                    attributes: ['id', 'kode', 'nama', 'totalSks', 'adaPraktikum'],
                    model: MataKuliah,
                    as: 'mataKuliah'
                }
            }
        }
    })

    if (!krsMahasiswaDetail || !krsMahasiswaDetail.rincianKrsMahasiswa) {
        return { totalBiaya: 0 }
    }

    const hargaSatuanSks = 100000
    const hargaPraktikum = 200000

    const totalBiaya = krsMahasiswaDetail.rincianKrsMahasiswa.reduce((acc, item) => {
        const mk = item.kelasKuliah?.mataKuliah || {}
        const sks = Number(mk.totalSks || 0)
        const adaPraktikum = Boolean(mk.adaPraktikum)

        const hargaSks = sks * hargaSatuanSks
        const hargaPraktikumItem = adaPraktikum ? hargaPraktikum : 0

        return acc + hargaSks + hargaPraktikumItem
    }, 0)

    return { totalBiaya }
}

export const notifyStep3 = async (mahasiswa) => {
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    })
    if (!activePeriod) {
        throw new Error('Tidak ada periode akademik aktif yang ditemukan')
    }

    return KrsMahasiswa.update({
        status: 'Disetujui',
    }, {
        where: {
            siakPeriodeAkademikId: activePeriod.id,
            siakMahasiswaId: mahasiswa.id,
            status: 'Diverifikasi'
        }
    });
}