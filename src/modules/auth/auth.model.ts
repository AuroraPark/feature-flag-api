import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database";

// 타입정의
// 모델이 가진 모든 필드
interface UserAttributes {
    id: number;
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'viewer';
    apiKey: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

// 생성 시 선택적인 필드
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'apiKey' | 'createdAt' | 'updatedAt'> { }

// 모델 클래스
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    declare id: number;
    declare email: string;
    declare password: string;
    declare name: string;
    declare role: 'admin' | 'viewer';
    declare apiKey: string | null;
    declare createdAt: Date;
    declare updatedAt: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        email: {
            type: DataTypes.STRING(255),
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'viewer'),
            defaultValue: 'admin',
        },
        apiKey: {
            type: DataTypes.STRING(64),
            unique: true,
            allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
    },
    {
        sequelize,
        tableName: 'users',
        underscored: true,     // JS camelCase → DB snake_case
        timestamps: true,       // createdAt, updatedAt 자동 관리
    }
);

export default User;