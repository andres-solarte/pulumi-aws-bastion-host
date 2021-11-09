import * as pulumi from '@pulumi/pulumi'
import createBastionInstnce from './resources/ec2'

module.exports = pulumi.Output.create(createBastionInstnce())
