import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class EkivalensiMataKuliah extends Model {
        static associate(models) {
            // Relasi ke Mata Kuliah Kurikulum Baru
            this.belongsTo(models.MataKuliah, {
                foreignKey: 'siak_mata_kuliah_id',
                as: 'mataKuliahBaru'
            });
            // Relasi ke Mata Kuliah Kurikulum Lama (Untuk dropdown)
            this.belongsTo(models.MataKuliah, {
                foreignKey: 'siak_mata_kuliah_lama_id',
                as: 'mataKuliahLama'
            });
        }
    }

    EkivalensiMataKuliah.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7,
            allowNull: false
        },
        siakMataKuliahId: {
            type: DataTypes.UUID,
            field: 'siak_mata_kuliah_id',
            allowNull: false
        },
        siakMataKuliahLamaId: {
            type: DataTypes.UUID,
            field: 'siak_mata_kuliah_lama_id',
            allowNull: false
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,
        modelName: "EkivalensiMataKuliah",
        tableName: "siak_ekivalensi_mata_kuliah",
    });

    return EkivalensiMataKuliah;
};