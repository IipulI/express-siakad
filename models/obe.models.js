// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Obe extends Model {
        static associate(models) {
            this.belongsTo(models.ProgramStudi, {
                foreignKey: "siak_program_studi_id",
                as: "programStudi",
            })

            this.belongsTo(models.TahunKurikulum, {
                foreignKey: "siak_tahun_kurikulum_id",
                as: "tahunKurikulum"
            })
        }
    }

    Obe.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: 'siak_program_studi_id'
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: 'siak_tahun_kurikulum_id'
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Obe",
            tableName: "siak_obe",
        }
    );

    return Obe
}
