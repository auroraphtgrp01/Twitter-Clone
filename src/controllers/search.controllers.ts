import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response, NextFunction } from 'express'
import { SearchQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'
import { TokenPayload } from '~/models/requests/User.requests'
import { MediaQueryType, PeopleFollow } from '~/constants/enums'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const media_type = req.query.media_type as MediaQueryType
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await searchService.search({
    limit,
    page,
    content: req.query.content as string,
    user_id,
    media_type,
    people_follow: req.query.people_follow as PeopleFollow
  })
  res.json({
    message: 'Search successfully',
    tweets: result.tweets,
    limit,
    page,
    total_page: Math.ceil(result.total / limit)
  })
}
