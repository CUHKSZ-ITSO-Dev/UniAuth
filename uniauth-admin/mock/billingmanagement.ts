// @ts-ignore
import { Request, Response } from "express";

export default {
  "PUT /api/v1/admin/chat-categories/:id": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /api/v1/chat/bill": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /api/v1/chat/ensure-account": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /api/v1/chat/reset-balance": (req: Request, res: Response) => {
    res.status(200).send({});
  },
};
