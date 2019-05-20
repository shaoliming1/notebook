import json

from tornado import web

from notebook.base.handlers import APIHandler

#TODO: create the session may not seem good here
# engine = create_engine("sqlite:////home/shaoliming/foo.db")
# Base.metadata.create_all(engine)
# Session = sessionmaker(bind=engine)
# session = Session()
from notebook.models import DBSession, Rank, User


class MainRankHandler(APIHandler):

    @web.authenticated
    def get(self):
        #offset = self.request.query_arguments.get('offset')
        offset = self.get_argument('offset', 0)
        limit = self.get_argument('limit', 10)
        session = DBSession()
        from sqlalchemy.orm import selectinload
        res = session.query(Rank).join(User).order_by(Rank.score.desc()).offset(int(offset)).limit(int(limit)).all()
        ret = list()
        i = 1
        print(res)
        for e in res:
            entry = dict(
                username=e.user.name,
                rank=i,
                score=e.score
            )
            ret.append(entry)
            i+=1
        session.commit()
        self.finish(json.dumps(ret))




default_handlers = [
    (r"/api/rank", MainRankHandler)
]