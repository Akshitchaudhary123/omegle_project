

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        // If it's a Nest HttpException (like BadRequestException, etc.)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'string' ? res : (res as any).message;
        } else if (exception instanceof Error) {
            // If it's a normal JS error (like bcrypt error)
            message = exception.message;
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
        });
    }
}
