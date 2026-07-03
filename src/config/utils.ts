import bcrypt from "bcrypt"
import "dotenv/config"

export async function protect(txt:string){
    const salt = Number(process.env.SALT);
    return await bcrypt.hash(txt, salt);
    
}
