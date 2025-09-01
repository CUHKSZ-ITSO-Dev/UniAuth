// @ts-ignore
import { Request, Response } from "express";

export default {
  "POST /auth/admin/policies/add": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /auth/admin/policies/delete": (req: Request, res: Response) => {
    res.status(200).send({});
  },
  "POST /auth/admin/policies/edit": (req: Request, res: Response) => {
    res.status(200).send({});
  },
};
