import db from '../models/index.js'

const {
    HasilStudi,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    RincianKrsMahasiswa,
} = db

export const getHasilStudi = async(mahasiswaId, periodeId) => {
    try {
        const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
            attributes: [
                'id', 'nama', 'periodeMasuk'
            ]
        })
        if(!mahasiswa){
            throw new Error(`Mahasiswa dengan Id ${mahasiswaId} tidak ditemukan`)
        }

        const periodeAkademik = await PeriodeAkademik.findByPk(periodeId, {
            attributes: [
                'id', 'kode'
            ]
        })
        if (!periodeAkademik){
            throw new Error(`Periode akademik tidak ditemukan`)
        }

        const hasilStudi = await HasilStudi.findOne({
            attributes: [
                'semester', 'ips', 'ipk', 'sksDiambil', 'sksLulus'
            ],
            where: {
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: periodeId
            },
        })
        if(!hasilStudi){
            throw new Error(`Hasil studi tidak ditemukan`)
        }

        const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
            attributes: [
                'id','kehadiran', 'tugas', 'uts', 'uas', 'nilai', 'hurufMutu', 'angkaMutu', 'nilaiAkhir',
                'siakKelasKuliahId'
            ],
            include: [
                {
                    attributes: [],
                    where: {
                        siakMahasiswaId: mahasiswaId,
                        siakPeriodeAkademikId: periodeId
                    },
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa',
                    required: true
                },
                {
                    attributes: [],
                    model: KelasKuliah,
                    as: 'kelasKuliah',
                    include: {
                        attributes: [
                            'nama', 'kode', 'totalSks'
                        ],
                        model: MataKuliah,
                        as: 'mataKuliah'
                    }
                }
            ],
            raw: true
        })

        return {
            hasilStudi: hasilStudi,
            rincianKrs: rincianKrsMahasiswa,
        }
    }
    catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}