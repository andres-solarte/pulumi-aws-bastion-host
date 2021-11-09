import * as aws from "@pulumi/aws";
import { SecretsManager } from 'aws-sdk'

const getSecretValue = async (secretId: string): Promise<string> => {
    const region = await aws.getRegion()
    const secretsManager = new SecretsManager({ region: region.name })

    try {
        const secret = await aws.secretsmanager.getSecret({ name: secretId })

        const secretValue = await secretsManager
            .getSecretValue({ SecretId: secret.arn })
            .promise()

        return secretValue.SecretString!
    } catch (error) {
        throw new Error(`A secret with ID ${secretId} must be set. ${error}`)
    }
}

export const getBastionPublicKey = (): Promise<string> => {
    return getSecretValue('bastionPublicKey')
}
