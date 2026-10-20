import { Request, Response } from 'express';
import { LocationModel } from '../models/location.model';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class LocationController {
  static async getDivisions(req: Request, res: Response) {
    try {
      const divisions = await LocationModel.listDivisions();
      return sendSuccess(res, divisions);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getDistricts(req: Request, res: Response) {
    try {
      const divisionId = req.query.divisionId ? parseInt(req.query.divisionId as string, 10) : undefined;
      const districts = await LocationModel.listDistricts(divisionId);
      return sendSuccess(res, districts);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }

  static async getUpazilas(req: Request, res: Response) {
    try {
      const districtId = parseInt(req.query.districtId as string, 10);
      if (isNaN(districtId)) {
        return sendError(res, 'BAD_REQUEST', 'districtId is required', 400);
      }
      const upazilas = await LocationModel.listUpazilas(districtId);
      return sendSuccess(res, upazilas);
    } catch (err: any) {
      return sendError(res, 'SERVER_ERROR', err.message, 500);
    }
  }
}
