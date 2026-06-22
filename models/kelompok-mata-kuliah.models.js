import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class KelompokMataKuliah extends Model {
        static associate(models) {
            this.hasMany(models.MataKuliah, {
                foreignKey: 'siak_kelompok_mata_kuliah_id',
                as: 'mataKuliahs'
            });
        }
    }

    KelompokMataKuliah.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        kode: DataTypes.STRING(50),
        nama: DataTypes.STRING(255)
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true, // Karena di SQL dump ada deleted_at
        modelName: "KelompokMataKuliah",
        tableName: "siak_kelompok_mata_kuliah"
    });

    return KelompokMataKuliah;
};