require 'thin'
require 'sinatra'
require 'sinatra/base'
require 'sinatra/cross_origin'
require 'json'
require 'pp'
require 'time'

$stdout.sync = true

Rack::Utils.multipart_part_limit = 0

class MyApp < Sinatra::Base
  register Sinatra::CrossOrigin

  set :static, true
  set :public_dir, 'public'

  get '/exclusions' do
    cross_origin
    puts "exclusions"  
    exclusions = File.read("exclusions.txt")
    exclusions
  end


  post '/metadata' do
   begin
    cross_origin
    request.body.rewind
    rb = request.body.read
    puts rb
    request_payload = JSON.parse rb
    result_arr = request_payload["data"].sort_by{|m| m["power"].to_i.abs}
    puts "=====got metadata====="
    puts result_arr.to_s

    rescue Exception => e
       puts "METADATA ERROR"
       puts e
       puts "\n\n"
    end
    "ok"
  end

end


