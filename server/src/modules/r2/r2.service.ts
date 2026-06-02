import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

type UploadResult = {
  key: string;
  url: string;
};

interface UploadVerificationDocumentParams {
  cityId: string;
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}

interface UploadCityRequestAttachmentParams {
  cityId: string;
  requestId: string;
  reportId?: string;
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}

interface UploadCityNewsAttachmentParams {
  cityId: string;
  newsId: string;
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
}

@Injectable()
export class R2StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('r2.endpoint') || '';
    const accessKeyId = this.configService.get<string>('r2.accessKeyId') || '';
    const secretAccessKey =
      this.configService.get<string>('r2.secretAccessKey') || '';

    this.bucketName = this.configService.get<string>('r2.bucketName') || '';
    this.publicBaseUrl =
      this.configService.get<string>('r2.publicBaseUrl') || '';

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucketName) {
      throw new InternalServerErrorException(
        'R2 configuration is missing. Please check server environment variables.',
      );
    }

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadCityVerificationDocument(
    params: UploadVerificationDocumentParams,
  ): Promise<UploadResult> {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `city-init/${params.cityId}/${Date.now()}-${safeName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType || 'application/octet-stream',
      }),
    );

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
    };
  }

  async uploadCityRequestAttachment(
    params: UploadCityRequestAttachmentParams,
  ): Promise<UploadResult> {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const scope = params.reportId
      ? `reports/${params.reportId}`
      : `requests/${params.requestId}`;
    const key = `city-requests/${params.cityId}/${scope}/${Date.now()}-${safeName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType || 'application/octet-stream',
      }),
    );

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
    };
  }

  async uploadCityNewsAttachment(params: UploadCityNewsAttachmentParams) {
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `city/${params.cityId}/news/${Date.now()}-${safeName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimeType || 'application/octet-stream',
      }),
    );

    return {
      key,
      url: `${this.publicBaseUrl}/${key}`,
    };
  }
}
