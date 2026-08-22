import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult, Id } from '@/types/api'

/**
 * Reference API module. Function names follow the list / get / add / update /
 * del convention and map one-to-one onto the five routes the Go side exposes
 * under /api/v1/demo-product.
 *
 * The type argument on each call is what lets useTable and useForm infer their
 * generics; see utils/request.d.ts for why it describes the envelope rather
 * than the payload.
 */

export interface Product {
  id?: number
  name?: string
  code?: string
  price?: number
  /** '1' active, '2' inactive. */
  status?: string
  remark?: string
  createdAt?: string
}

export interface ProductQuery {
  name?: string
  status?: string
}

export function listProduct(query: ProductQuery & PageQuery) {
  return request<ApiResponse<PageResult<Product>>>({
    url: '/api/v1/demo-product',
    method: 'get',
    params: query
  })
}

export function getProduct(id: number) {
  return request<ApiResponse<Product>>({
    url: '/api/v1/demo-product/' + id,
    method: 'get'
  })
}

export function addProduct(data: Product) {
  return request<ApiResponse<Product>>({
    url: '/api/v1/demo-product',
    method: 'post',
    data
  })
}

export function updateProduct(data: Product) {
  return request<ApiResponse<Product>>({
    url: '/api/v1/demo-product/' + data.id,
    method: 'put',
    data
  })
}

export function delProduct(ids: Id[]) {
  return request<ApiResponse<null>>({
    url: '/api/v1/demo-product',
    method: 'delete',
    data: { ids: ids.map(Number) }
  })
}
