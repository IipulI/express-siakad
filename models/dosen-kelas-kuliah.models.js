// /models/bidang-ilmu.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class DosenKelasKuliah extends Model {
        static associate(models) {
            this.belongsTo(models.KelasKuliah, {
                foreignKey: 'siak_kelas_kuliah_id',
                as: 'kelasKuliah'
            })

            this.belongsTo(models.Dosen, {
                foreignKey: 'siak_dosen_id',
                as: 'dosen'
            })
        }
    }

    DosenKelasKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            siakKelasKuliahId: {
                type: DataTypes.UUID,
                field: 'siak_kelas_kuliah_id',
            },
            siakDosenId: {
                type: DataTypes.UUID,
                field: 'siak_dosen_id',
            }
        },

        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "DosenKelasKuliah",
            tableName: "siak_dosen_kelas_kuliah",
        }
    );

    return DosenKelasKuliah;
}