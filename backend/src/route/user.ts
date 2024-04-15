import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from "hono/jwt";
import { signinInput, signupInput } from "@al1_/medium-common";

export const userRouter = new Hono<{
        Bindings:{
            DATABASE_URL: string
            JWT_SECRET: string
        }
    }>();


userRouter.post('/signup',async (c) => {
  
  const prisma = new PrismaClient({datasourceUrl: c.env.DATABASE_URL,}).$extends(withAccelerate())

   const body = await c.req.json();
   const {success} = signupInput.safeParse(body);
   if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }

  try {
     
     const user = await  prisma.user.create({
        data: {
          email:body.email,
          password:body.password
        }
      });

      const jwt = await sign({
        id: user.id
      },c.env.JWT_SECRET)
      
      return c.text(jwt);
  } catch(e){
      c.status(403);
      return c.text('userId already exist');
  }
  
})

userRouter.post('/signin',async (c)=>{
  const prisma = new PrismaClient({datasourceUrl: c.env.DATABASE_URL, }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
  const user = await prisma.user.findUnique({
    where:{
      email:body.email
    }
  })
  if(!user){
    c.status(403);
    return c.json({
      message:"Invalid! Please SignUp"
    })
  }

  const token =await sign({id:user.id},c.env.JWT_SECRET)
  return c.json({token});
})