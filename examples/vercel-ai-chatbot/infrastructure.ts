import { VellumProvider } from 'vellum-ai/terraform/provider'
import { DocumentIndex } from 'vellum-ai/terraform/document-index'
import dotenv from 'dotenv'
import { App, TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import { cdktfIndex } from './workspace/searchIndexes'
dotenv.config()

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    new VellumProvider(this, 'vellum', {
      apiKey: process.env.VELLUM_API_KEY
    })

    new DocumentIndex(this, 'managed', cdktfIndex)
  }
}

const app = new App()
new MyStack(app, 'my-app')
app.synth()
