from io import BytesIO
from covfee.server.rest_api.api import jsonify_or_404
from orm import Chunk

def make_routes(api, db):
    @api.route('/responses/<rid>/chunks', methods=['GET'])
    def query_chunks(rid):
        response = db.session.query(TaskResponse).get(int(rid))
        if response is None:
            return jsonify_or_404({'msg': 'invalid response'}), 400

        chunk_bytes = response.pack_chunks()
        return send_file(BytesIO(chunk_bytes), mimetype='application/octet-stream'), 200

    # receive a chunk of a response, for continuous responses
    @api.route('/responses/<rid>/chunk', methods=['POST'])
    def response_chunk(rid):
        sent_index = int(request.args.get('index'))
        length = int(request.args.get('length'))

        response = db.session.query(TaskResponse).get(int(rid))
        if response is None:
            return jsonify({'msg': 'invalid response'}), 400
        if response.submitted:
            return jsonify({'msg': 'response is already submitted'}), 400

        # if there is a previous chunk with the same index, overwrite it
        if response.chunks.count() > 0:
            chunk = next((chunk for chunk in response.chunks if chunk.index == sent_index), None)
            if chunk is not None:
                chunk.update(data=request.get_data(), length=length)

                db.session.commit()
                return jsonify({'success': True}), 201

        # no previous chunk with the same index -> append the chunk
        chunk = Chunk(index=sent_index, length=length, data=request.get_data())
        response.chunks.append(chunk)
        db.session.add(response)
        db.session.commit()
        return jsonify({'success': True}), 201