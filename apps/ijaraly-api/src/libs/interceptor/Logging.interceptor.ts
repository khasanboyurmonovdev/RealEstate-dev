import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { stringify } from "querystring";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger: Logger = new Logger();


    public intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const recordTime = Date.now();
        const requestType = context.getType<GqlContextType>();
        
        if (requestType === "http") {
            /** Develop if needed! */ 
        } else if (requestType === 'graphql') {
            /** (1) Print Request */
            const gqlContext = GqlExecutionContext.create(context);
            const data = gqlContext.getContext().req.body;
            this.logger.log(`Type ${this.stringify(data)}`, 'REQUEST');

             /** (2) Errors handling via GraphQL */
              /** (3) No Errors giving Response below */
            return next
        .handle()
        .pipe(
            tap((context) => {
                const responseTime = Date.now() - recordTime;
                this.logger.log(
                    `${this.stringify(context)}\x1b[33m +${responseTime}ms \n\n \x1b[0m`,
                    'RESPONSE',
                );
            }),
        );
        }        
    }

    private stringify(context: ExecutionContext): string {
        console.log(typeof context);
        return JSON.stringify(context).slice(0, 76);
    }
}