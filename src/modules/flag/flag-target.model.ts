import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';
import Flag from './flag.model';

interface FlagTargetAttributes {
    id: number;
    flagId: number;
    userId: string;
    createdAt: Date;
}

interface FlagTargetCreationAttributes extends Optional<FlagTargetAttributes, 'id' | 'createdAt'> { }

class FlagTarget extends Model<FlagTargetAttributes, FlagTargetCreationAttributes> implements FlagTargetAttributes {
    declare id: number;
    declare flagId: number;
    declare userId: string;
    declare createdAt: Date;
}

FlagTarget.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        flagId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'flags',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        createdAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'flag_targets',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['flag_id', 'user_id'],
                name: 'idx_flag_target_unique',
            },
        ],
    }
);

Flag.hasMany(FlagTarget, {
    foreignKey: 'flagId',
    as: 'targets',
});

FlagTarget.belongsTo(Flag, {
    foreignKey: 'flagId',
});

export default FlagTarget;