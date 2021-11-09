import * as aws from "@pulumi/aws";
import { GetAmiResult } from "@pulumi/aws/ec2";

import { getBastionPublicKey } from "../lib/secrets-manager";

export const getDefaultVpc = async (): Promise<aws.ec2.GetVpcResult> => await aws.ec2.getVpc({ default: true })

export const createSecurityGroups = async (): Promise<aws.ec2.SecurityGroup[]> => {
    const sshAdminDesktop = new aws.ec2.SecurityGroup('sshAdminDesktop', {
        ingress: [
            {
                description: 'SSH',
                fromPort: 22,
                toPort: 22,
                protocol: 'tcp',
                cidrBlocks: ["0.0.0.0/0"]
            }
        ],
        egress: [
            {
                fromPort: 0,
                toPort: 0,
                protocol: '-1',
                cidrBlocks: ["0.0.0.0/0"]
            }
        ]
    })

    return [sshAdminDesktop]
}


const createKeyPair = async (): Promise<aws.ec2.KeyPair> => {
    return new aws.ec2.KeyPair('bastion', {
        publicKey: await getBastionPublicKey(),
    });
}

const findBastionAmi = (): Promise<GetAmiResult> => {
    return aws.ec2.getAmi({
        mostRecent: true,
        filters: [
            {
                name: "name",
                values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"],
            },
            {
                name: "virtualization-type",
                values: ["hvm"],
            },
        ],
        owners: ["099720109477"],
    })
}

const createBastionInstnce = async (): Promise<aws.ec2.Instance> => {
    const ami = await findBastionAmi()
    const keyPair = await createKeyPair()
    const vpc = await getDefaultVpc()
    const subnetIds = await aws.ec2.getSubnetIds({ vpcId: vpc.id })
    const [subnetId] = subnetIds.ids
    const securityGroups = await createSecurityGroups()

    return new aws.ec2.Instance('bastion', {
        ami: ami.id,
        instanceType: 't3.micro',
        keyName: keyPair.keyName,
        associatePublicIpAddress: true,
        subnetId,
        vpcSecurityGroupIds: securityGroups.map(securityGroup => securityGroup.id)
    })
}

export default createBastionInstnce
