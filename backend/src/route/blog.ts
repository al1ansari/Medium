
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { use } from "hono/jsx";
import { verify } from "hono/jwt";
import {createPostInput, updatePostInput} from '@al1_/medium-common'

export const blogRouter = new Hono<{
    Bindings:{
        DATABASE_URL:string,
        JWT_SECRET:string
    },
    Variables:{
        userId:string
    }
}>();

blogRouter.get('/bulk', async(c) => {
  const prisma = new PrismaClient({datasourceUrl:c.env.DATABASE_URL}).$extends(withAccelerate())
  const post = await prisma.post.findMany();
  return c.json({post});
})

blogRouter.use(async (c,next)=>{
    try{
        const jwt = c.req.header('Authorization')
    if(!jwt){
        c.status(401)
        return c.json({error:"Unauthorized"});
    }
    const token = jwt?.split(' ')[1]
    const payload = await verify(token, c.env.JWT_SECRET)
    if(!payload){
        c.status(401)
        return c.json({error:'Unauthorized'})
    }
    c.set('userId',payload.id)
    await next();
    }catch(e){
      c.status(403);
      return c.text('Please pass the correct credential');
  }
})

blogRouter.post('/',async(c) => {
    const prisma = new PrismaClient({datasourceUrl:c.env.DATABASE_URL}).$extends(withAccelerate());
    const body = await c.req.json();
     const { success } = createPostInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const userId = c.get('userId');
    console.log("here 1")
    try{
        console.log("here 2")
        const post = await prisma.post.create({
            data:{
                authorId:userId,
                title:body.title,
                content:body.content
            }
        })
        console.log("here 3")
        return c.json({
            id:post.id
        });
    }catch(e){
        c.status(401);
        return c.text("Error")
    }
})

blogRouter.put('/',async(c) => {
    const prisma = new PrismaClient({datasourceUrl:c.env.DATABASE_URL}).$extends(withAccelerate());
    const body = await c.req.json();
    const { success } = updatePostInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const userId = c.get('userId');
    // console.log(userId)
    try{
        // const beforePost =await  prisma.post.findUnique({
        //     where:{
        //         id:body.id,
        //         authorId:userId
        //     }
        // })
        // console.log(beforePost)
        // console.log(body.title)
        // console.log(body.content)
        const post =await prisma.post.update({
            where:{
                id:body.id,
                authorId:userId
            },
            data:{
                title:body.title,
                content:body.content
            }
        })
        return c.json(post)
    }catch(e){
        c.status(401);
        return c.json({
            error:"Invlaid"
        })
    }
})

blogRouter.get('/:id',async (c) => {
 const prisma = new PrismaClient({datasourceUrl:c.env.DATABASE_URL}).$extends(withAccelerate())
 const id = c.req.param('id')
 const userId = c.get('userId')

 const post = await prisma.post.findUnique({
    where:{
        id:id,
        authorId:userId
    }
 })
  return c.json(post)
})

