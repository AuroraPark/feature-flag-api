import User from "./auth.model";

class AuthRepository {
    async findByEmail(email: string): Promise<User | null> {
        return User.findOne({ where: { email } });
    }

    async findByApiKey(apiKey: string): Promise<User | null> {
        return User.findOne({ where: { apiKey } });
    }

    async create(data: { email: string, password: string, name: string, apiKey: string }): Promise<User> {
        return User.create(data);
    }
}

export default new AuthRepository();