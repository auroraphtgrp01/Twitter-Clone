import { Request, Response, NextFunction } from 'express'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body)
  const { email, password } = req.body
  if (email === 'leminhtuan@gmail.com' && password == '123334') {
    return res.json({ message: 'Login Success' })
  }
  return res.status(400).json({ message: 'Login Failed' })
}
