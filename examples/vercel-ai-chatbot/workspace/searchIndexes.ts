import { DocumentIndexCreateRequest } from 'vellum-ai/api'

export const cdktfIndex: Omit<DocumentIndexCreateRequest, 'indexingConfig'> = {
  label: 'CDKTF Index',
  name: 'cdktf-index'
}
