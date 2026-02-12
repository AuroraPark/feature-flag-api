import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";
import User from "../auth/auth.model";



/**
 * Flag model attributes
 */
interface FlagAttributes {
    id: number;
    key: string;
    name: string;
    description: string | null;
    type: 'boolean' | 'percentage' | 'user_target';
    enabled: boolean;
    percentage: number;
    createdBy: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}


/**
 * Flag model creation attributes
 */
interface FlagCreationAttributes extends Optional<
    FlagAttributes,
    'id' | 'description' | 'enabled' | 'percentage' | 'deletedAt' | 'createdAt' | 'updatedAt'
> { }

/**
 * Flag model class
 */
class Flag extends Model<FlagAttributes, FlagCreationAttributes> implements FlagAttributes {
    declare id: number;
    declare key: string;
    declare name: string;
    declare description: string | null;
    declare type: 'boolean' | 'percentage' | 'user_target';
    declare enabled: boolean;
    declare percentage: number;
    declare createdBy: number;
    declare deletedAt: Date | null;
    declare createdAt: Date;
    declare updatedAt: Date;
}


Flag.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            validate: {
                is: /^[a-z0-9-]+$/,  // kebab-case만 허용
            },
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM('boolean', 'percentage', 'user_target'),
            allowNull: false,
        },
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        percentage: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 100,
            },
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'flags',
        underscored: true,
        timestamps: true,
        paranoid: true,
    }
);

Flag.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
});

export default Flag;
