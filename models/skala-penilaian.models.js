import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class SkalaPenilaian extends Model {
        static associate(models) {
            // Relasi ke Program Studi
            this.belongsTo(models.ProgramStudi, {
                foreignKey: 'siak_program_studi_id',
                as: 'programStudi'
            });

            // Relasi ke Tahun Kurikulum
            this.belongsTo(models.TahunKurikulum, {
                foreignKey: 'siak_tahun_kurikulum_id',
                as: 'tahunKurikulum'
            });
          
    this.belongsTo(models.PeriodeAkademik, {
        foreignKey: 'siak_periode_akademik_id',
        as: 'periode'
    });
            
            
        }
    }

    SkalaPenilaian.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: 'siak_program_studi_id',
                allowNull: false
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: 'siak_tahun_kurikulum_id',
                allowNull: false
            },
            hurufMutu: {
                type: DataTypes.STRING(255),
                field: 'huruf_mutu',
                allowNull: false
            },
            angkaMutu: {
                type: DataTypes.DECIMAL(3, 2),
                field: 'angka_mutu',
                allowNull: false
            },
            nilaiMin: {
                type: DataTypes.DECIMAL(5, 2),
                field: 'nilai_min',
                allowNull: false
            },
            nilaiMax: {
                type: DataTypes.DECIMAL(5, 2),
                field: 'nilai_max',
                allowNull: false
            },
            // Kolom baru dari hasil migration tadi
            keterangan: {
                type: DataTypes.STRING,
                allowNull: true
            },
            isDefault: {
                type: DataTypes.BOOLEAN,
                field: 'is_default',
                allowNull: true,
                defaultValue: false
            },
            siakPeriodeAkademikId: {
    type: DataTypes.UUID,
    field: 'siak_periode_akademik_id', // 👈 Jembatan ke database
    allowNull: true
}
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true, // Karena di database ada deleted_at
            modelName: 'SkalaPenilaian',
            tableName: 'siak_skala_penilaian'
        }
    );

    return SkalaPenilaian;
};