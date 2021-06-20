import { get, merge } from "lodash";
import { pluginConfigExt, runServerless } from "../utils/runServerless";

describe("permissions", () => {
    it("should not override user-defined role", async () => {
        const { cfTemplate } = await runServerless({
            fixture: "permissions",
            configExt: merge(pluginConfigExt, {
                provider: {
                    iam: {
                        role: "arn:aws:iam::123456789012:role/role",
                    },
                },
            }),
            cliArgs: ["package"],
        });
        expect(cfTemplate.Resources.FooLambdaFunction).toMatchObject({
            Properties: {
                Role: "arn:aws:iam::123456789012:role/role",
            },
        });
    });

    it("should append permissions when using the deprecated iamRoleStatements", async () => {
        const { cfTemplate } = await runServerless({
            fixture: "permissions",
            configExt: merge(pluginConfigExt, {
                provider: {
                    iam: {
                        role: {
                            statements: [
                                {
                                    Effect: "Allow",
                                    Action: ["dynamodb:PutItem"],
                                    Resource: "arn:aws:dynamodb:us-east-1:123456789012:table/myDynamoDBTable",
                                },
                            ],
                        },
                    },
                },
            }),
            cliArgs: ["package"],
        });
        expect(
            get(cfTemplate.Resources.IamRoleLambdaExecution, "Properties.Policies[0].PolicyDocument.Statement")
        ).toContainEqual({
            Effect: "Allow",
            Action: ["dynamodb:PutItem"],
            Resource: "arn:aws:dynamodb:us-east-1:123456789012:table/myDynamoDBTable",
        });
        expect(
            get(cfTemplate.Resources.IamRoleLambdaExecution, "Properties.Policies[0].PolicyDocument.Statement")
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    Effect: "Allow",
                    Action: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
                }),
            ])
        );
    });
});
