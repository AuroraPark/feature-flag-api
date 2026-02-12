import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';
import User from '../auth/auth.model';
import Flag from '../flag/flag.model';

interface AuditLogAttributes {
    id: number;
    flagId: number;                                          // FK → flags.id
    action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';     // 어떤 동작인지
    changedBy: number;                                       // FK → users.id (누가 했는지)
    before: Record<string, unknown> | null;                  // 변경 전 상태 (JSON)
    after: Record<string, unknown> | null;                   // 변경 후 상태 (JSON)
    createdAt: Date;
}

interface AuditLogCreationAttributes extends Optional<
    AuditLogAttributes,
    'id' | 'before' | 'after' | 'createdAt'
> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes>
    implements AuditLogAttributes {
    declare id: number;
    declare flagId: number;
    declare action: 'CREATE' | 'UPDATE' | 'TOGGLE' | 'DELETE';
    declare changedBy: number;
    declare before: Record<string, unknown> | null;
    declare after: Record<string, unknown> | null;
    declare createdAt: Date;
}

AuditLog.init(
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
        },
        action: {
            type: DataTypes.ENUM('CREATE', 'UPDATE', 'TOGGLE', 'DELETE'),
            allowNull: false,
        },
        changedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        before: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        after: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
        },
    },
    {
        sequelize,
        tableName: 'audit_logs',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    }
);

AuditLog.belongsTo(Flag, {
    foreignKey: 'flagId',
    as: 'flag',
});

AuditLog.belongsTo(User, {
    foreignKey: 'changedBy',
    as: 'changer',
});

export default AuditLog;