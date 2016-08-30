#!/usr/bin/env perl
use Mojolicious::Lite;
use Mojo::JSON 'j';
use Data::Dumper;
use Time::Local;
use POSIX 'strftime';
use Math::Round;
use Text::ASCIITable;
use Math::Interpolate qw(linear_interpolate);


plugin 'RenderFile';
plugin AccessLog => {log => 'log/access.log'};

my ( $month, $day, $year );

any '/download' => sub {
    my $self    = shift;
    my $example = $self->param('example');
    $self->render_file( filepath => "./config/${example}.json" );
};

any '/' => sub {
    my $self = shift;

    my $routes = $self->param('routes_jsonstr');

    my $prev    = $self->param('prev')    || '';
    my $script  = $self->param('script1') || '';
    my $met     = $self->param('met')     || '';
    my $met_an  = $self->param('met_an')  || '';
    my $met_an2 = $self->param('met_an2') || '';

    if ( $self->param('met') ) {
        unless (
            $self->param('met') =~ /\A [\d\*\s\(\)rgym\.\-\+\?\:\>\<\/]+ \z/ix )
        {
            $self->render('validation');
            return;
        }
    }

    my @met     = split( /\n/, $met );
    my @met_an  = split( /\n/, $met_an );
    my @met_an2 = split( /\n/, $met_an2 );

    foreach ( @met, @met_an, @met_an2 ) {
        s/y/\$y/g;
        s/r/rand/g;
        s/g\((\d+)\)/\@{\$graph[\$#graph - $1]}[2]/g;
        s/m/\@{\$graph[-1]}[2+\$c]/g;
    }
    my $model           = $self->param('model');
    my $NumberOfMetrics = scalar @met;
    $self->stash( NumberOfMetrics => \$NumberOfMetrics );
    $self->render('model') if $model;
    return if $model;

    my $datepicker = $self->param('datepicker');
    my $opt_d      = $self->param('days');
    my $opt_r      = $self->param('resource');
    my $sampling   = $self->param('sampling');
    my $tzOffset   = $self->param('tzOffset');

    if ($datepicker) {
        ( $month, $day, $year ) = split( /\//, $datepicker );
        $month =~ s/^0//;
        $day =~ s/^0//;
    }

    $self->render('index') unless $routes;
    return unless $routes;

    my @routes = split( /\r\n/, $routes );

    my $y;
    my @x;
    my @y;
    my @graph;

    my $sample_time = 300;
    $sample_time = $sampling if $sampling;

    my $first_coordinate = $routes[1];
    $first_coordinate =~ s/^.*,//;
    chomp $first_coordinate;

    my $epoch = epoch( 0, $month, $day, $year, $tzOffset );

    push @x, 0;
    push @y, $first_coordinate;
    my $x_base_epoch = $epoch;

    foreach (@routes) {
        chomp;
        next if /^time/;
        my ( $date, $weight ) = split( /,/, $_ );
        push @x, $date;
        push @y, $weight;
    }

    my $n_day = 0;
    my @temp;
    my $samples = 86400 / $sample_time;
    my $x;

    push @graph, [ 'timestamp', 'resource' ];
    for ( 0 .. $#met ) {
        my $cnt = ++$_;
        push $graph[0], "met${cnt}";
    }

    for ( 1 .. $opt_d ) {
        if ( ( $opt_d - $n_day ) == 2 ) {
            foreach my $x ( 1 .. ( ( $samples / 3 ) - 1 ) ) {
                my ( $y, $l_dy ) = linear_interpolate( $x, \@x, \@y );
                push @temp,
                  ( ( $x * $sample_time ) + $x_base_epoch ) +
                  ( $n_day * 86400 ), $opt_r;
                my $c = 0;

                for ( 0 .. $#met ) {

                    if ( $met_an2[$_] ) {
                        my $value = nearest( .001, eval( $met_an[$_] ) );
                        ( $value >= 0 )
                          ? ( push @temp, $value )
                          : ( push @temp, $y );
                    }
                    else {
                        my $value = nearest( .001, eval( $met[$_] ) );
                        ( $value >= 0 )
                          ? ( push @temp, $value )
                          : ( push @temp, $y );
                    }
                    $c++;
                }
                push @graph, [@temp];
                @temp = ();
            }
            foreach $x ( ( $samples / 3 ) .. ( 2 * $samples / 3 ) - 1 ) {
                my ( $y, $l_dy ) = linear_interpolate( $x, \@x, \@y );
                push @temp,
                  ( ( $x * $sample_time ) + $x_base_epoch ) +
                  ( $n_day * 86400 ), $opt_r;
                my $c = 0;
                foreach my $i (@met) {
                    my $value = nearest( .001, eval($i) );
                    ( $value && ( $value >= 0 ) )
                      ? ( push @temp, $value )
                      : ( push @temp, nearest( .001, $y ) );
                    $c++;
                }
                push @graph, [@temp];
                @temp = ();
            }
            foreach $x ( 2 * $samples / 3 .. $samples ) {
                my ( $y, $l_dy ) = linear_interpolate( $x, \@x, \@y );
                push @temp,
                  ( ( $x * $sample_time ) + $x_base_epoch ) +
                  ( $n_day * 86400 ), $opt_r;
                my $c = 0;

                for ( 0 .. $#met ) {
                    if ( $met_an2[$_] ) {
                        my $value = nearest( .001, eval( $met_an2[$_] ) );
                        ( $value >= 0 )
                          ? ( push @temp, $value )
                          : ( push @temp, $y );
                    }
                    else {
                        my $value = nearest( .001, eval( $met[$_] ) );
                        ( $value >= 0 )
                          ? ( push @temp, $value )
                          : ( push @temp, $y );
                    }
                    $c++;
                }
                push @graph, [@temp];
                @temp = ();
            }
        }
        else {
            foreach my $x ( 1 .. $samples ) {
                my ( $y, $l_dy ) = linear_interpolate( $x, \@x, \@y );
                push @temp,
                  ( ( $x * $sample_time ) + $x_base_epoch ) +
                  ( $n_day * 86400 ), $opt_r;
                my $c = 0;
                foreach my $i (@met) {
                    my $value = nearest( .001, eval($i) );
                    ( $value && ( $value >= 0 ) )
                      ? ( push @temp, $value )
                      : ( push @temp, nearest( .001, $y ) );
                    $c++;
                }
                push @graph, [@temp];
                @temp = ();
            }

        }
        $n_day++;
    }

    my ( $fx, $fy ) = @{ $graph[-1] };

    my $start = strftime( '1%y%m%d%H0000000', localtime($x_base_epoch) );
    my $end   = strftime( '1%y%m%d%H%M00000', localtime($fx) );
    my $start_extractor = strftime( '%Y%m%d-%H00', localtime($x_base_epoch) );
    my $end_extractor   = strftime( '%Y%m%d-%H%M', localtime($fx) );

#print "sep=,\n";
#warn "$_->[0],$_->[1],$_->[2],$_->[3],$_->[4],$_->[5],$_->[6],$_->[7]\n" foreach @graph;
#my $graph;
#print strftime('%m/%d/%Y|%H:%M', localtime($_->[0])).",$_->[1],$_->[2],$_->[3],$_->[4],$_->[5]\n" foreach @graph;

    $self->stash( graph => \@graph );
    if ($prev) {
        my $t = Text::ASCIITable->new(
            { headingText => 'First 10 rows of generated data' } );
        $t->setCols( $graph[0] );
        foreach my $aqq ( @graph[ 1 .. 10 ] ) {
            $t->addRow(@$aqq);
        }
        $self->stash( t => $t );
        $self->render('change_prev');
    }
    elsif ($script) {
        $self->stash(
            start           => $start,
            end             => $end,
            start_extractor => $start_extractor,
            end_extractor   => $end_extractor
        );
        $self->render('script');
    }
    else {
        $self->render('change');
    }

};

sub epoch {
    my ( $minute, $month, $day, $year, $tzOffset ) = @_;

    #my ($month, $day, $year) = split(m|/|,$date);
    my @t               = localtime(time);
    my $server_tzOffset = ( timelocal(@t) - timegm(@t) ) / 60;
    my $time            = timelocal( 0, 0, 0, $day, $month - 1, $year - 1900 );
    return $time + ( int( $minute - $server_tzOffset ) * 60 );
}

app->start;

__DATA__
@@ validation.html.ep
Validation error. Metric definition is validated with /\A [\d\*\s\(\)rgym\.\-\+\?\:\>\<\/]+ \z/ix perl regex. Check metrics definition in 'Options' tab.
