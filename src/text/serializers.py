# serializers.py
from rest_framework import serializers
from .models import Chat, History, File, Errors

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id','output_audio', 'output_image', 'added_at', 'updated_at']

class HistorySerializer(serializers.ModelSerializer):
    files = FileSerializer(many=True, read_only=True)

    class Meta:
        model = History
        fields = ['id','input_text', 'output_text', 'files', 'added_at', 'updated_at']

class ChatSerializer(serializers.ModelSerializer):
    interactions = HistorySerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['code', 'title', 'added_at', 'updated_at', 'interactions']

class ErrorSerializer(serializers.ModelSerializer):
    errors = ChatSerializer(many=True, read_only=True)
    class Meta:
        model = Errors
        fields = ['id','code', 'error', 'added_at', 'updated_at', "errors"]



# get serializers

class FileSerializers(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id','output_audio', 'output_image', 'added_at', 'updated_at']

class HistorySerializers(serializers.ModelSerializer):
    files = FileSerializers(many=True, read_only=True)

    class Meta:
        model = History
        fields =  ['id','input_text', 'output_text', 'files', 'added_at', 'updated_at']

class ChatSerializers(serializers.ModelSerializer):
    interactions = HistorySerializers(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['code', 'title', 'added_at', 'updated_at', 'interactions']

class ErrorsSerializers(serializers.ModelSerializer):
    errors = ChatSerializers(many=True, read_only=True)
    class Meta:
        model = Errors
        fields = ['id','code', 'error', 'added_at', 'updated_at', "errors"]


from rest_framework import serializers
from .models import Chat

class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ['code', 'title', 'added_at', 'updated_at']
        read_only_fields = ['code', 'added_at', 'updated_at']

    def create(self, validated_data):
        # Automatically generates 'code' in the model's save method
        return super().create(validated_data)
